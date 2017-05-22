#include <fstream>
#include <map>
#include <string>

#include <boost/filesystem.hpp>
#include <opencv2/highgui/highgui.hpp>
#include "json.hpp"

#include <simple-web-server/server_http.hpp>
#include <neatnet/params.h>
#include <neatnet/genalg.h>
#include <neatnet/netvisualize.h>


using HttpServer = SimpleWeb::Server<SimpleWeb::HTTP>;


const std::string HEAD = "HTTP/1.1 ";
const int NUM_INPUTS = 11;
const int NUM_OUTPUTS = 2;
const std::string BEST_NN_PATH = "./web/images/best_nn_";
const int IMAGE_WIDTH = 330;
const int IMAGE_HEIGHT = 250;


//================== Function declarations ====================
void default_resource_send(const HttpServer &server, const std::shared_ptr<HttpServer::Response> &response,
                           const std::shared_ptr<std::ifstream> &ifs);

void fitness_handler(std::shared_ptr<HttpServer::Response> response,
                     std::shared_ptr<HttpServer::Request> request,
                     neat::GenAlg& ga);

void init_brains_handler(std::shared_ptr<HttpServer::Response> response,
                         std::shared_ptr<HttpServer::Request> request,
                         neat::GenAlg& ga);

void default_resource_handler(HttpServer& server, std::shared_ptr<HttpServer::Response>& response,
                              std::shared_ptr<HttpServer::Request>& request);


//================== Main ====================
int main(int argc, const char* argv[])
{
    HttpServer server;
    server.config.port = 8080;

    neat::Params p("params.json");
    neat::GenAlg ga(NUM_INPUTS, NUM_OUTPUTS, p);

    // Register request handlers here
    server.resource["^/fitness$"]["POST"] = [&server, &ga](std::shared_ptr<HttpServer::Response> response,
                                                           std::shared_ptr<HttpServer::Request> request)
    {
        fitness_handler(response, request, ga);
    };

    server.resource["^/init_brains$"]["GET"] = [&ga](std::shared_ptr<HttpServer::Response> response,
                                                     std::shared_ptr<HttpServer::Request> request)
    {
        init_brains_handler(response, request, ga);
    };

    server.default_resource["GET"] = [&server](std::shared_ptr<HttpServer::Response> response,
                                               std::shared_ptr<HttpServer::Request> request)
    {
        default_resource_handler(server, response, request);
    };

    std::thread server_thread([&server]()
    {
        server.start();
    });

    std::this_thread::sleep_for(std::chrono::seconds(1));

    server_thread.join();

    return 0;
}


//================== Function definitions ====================

/**
 * All requests that are not defined explicitly are assumed to be file requests, and this handler fetches them.
 */
inline void default_resource_handler(HttpServer& server,
                              std::shared_ptr<HttpServer::Response>& response,
                              std::shared_ptr<HttpServer::Request>& request)
{
    try
    {
        auto web_root_path = boost::filesystem::canonical("web");
        auto path = boost::filesystem::canonical(web_root_path / request->path);

        std::cout << path << std::endl;
        if(boost::filesystem::is_directory(path))
        {
            path /= "index.html";
        }

        if(!(boost::filesystem::exists(path) && boost::filesystem::is_regular_file(path)))
        {
            throw std::invalid_argument("file does not exist");
        }

        auto ifs = std::make_shared<std::ifstream>();
        ifs->open(path.string(), std::ifstream::in | std::ios::binary | std::ios::ate);

        if(*ifs)
        {
            auto length = ifs->tellg();
            ifs->seekg(0, std::ios::beg);
            auto cache_control = "Cache-Control: no-cache, no-store, must_revalidate\r\nPragma: no-cache\r\nExpires: 0\r\n";

            *response << "HTTP/1.1 200 OK\r\n" << cache_control << "Content-Length: " << length << "\r\n\r\n";
            default_resource_send(server, response, ifs);
        }
        else
        {
            throw std::invalid_argument("could not read file");
        }
    }
    catch(const std::exception& e)
    {
        std::string content = "Could not open path " + request->path + ": " + e.what();
        *response << "HTTP/1.1 400 Bad Request\r\nContent-Length: "
                  << content.length()
                  << "\r\n\r\n"
                  << content;
    }
}


void generate_best_genome_images(neat::GenAlg& ga)
{
    int img_id = 1;
    for(auto& bg : ga.BestGenomes())
    {
        neat::NeuralNet nn(bg);
        auto img = neat::visualize_net(nn, IMAGE_WIDTH, IMAGE_HEIGHT, true);

        std::stringstream ss;
        ss << BEST_NN_PATH << img_id++ << ".png";

        cv::imwrite(ss.str(), img);
    }
}

/**
 * Handles fitnesses coming from the client.
 */
void fitness_handler(std::shared_ptr<HttpServer::Response> response,
                     std::shared_ptr<HttpServer::Request> request,
                     neat::GenAlg& ga)
{
    using json = nlohmann::json;
    try
    {
        std::string post_data = request->content.string();
        json obj = json::parse(post_data);
        std::vector<double> fitnesses;

        double max_fitness = 0.0;
        for(double fitness : obj)
        {
            max_fitness = std::max(max_fitness, fitness);
            fitnesses.push_back(fitness);
        }

        std::cout << "Best fitness this epoch: " << max_fitness << std::endl;
        std::cout << "Best ever fitness: " << ga.BestEverFitness() << std::endl;

        auto nns = ga.Epoch(fitnesses);
        auto stats = ga.SpeciesStats();
        std::cout << "Avg Species: " << stats.Mean()
                  << ", STD: " << stats.StandardDeviation()
                  << ", Min: " << stats.MinValue()
                  << ", Max: " << stats.MaxValue()
                  << ", Current: " << stats.LastValue()
                  << std::endl;

        json message;
        auto& species = ga.GetSpecies();

        std::unordered_map<std::string, double> species_counts;
        for(auto& specie : species)
        {
            std::cout << "Specie " << specie.ID() << " spawned "
                      << specie.SpawnsRequired() << " no improvement "
                      << specie.GensNoImprovement() << std::endl;
            species_counts[std::to_string(specie.ID())] = specie.SpawnsRequired();
        }

        json networks_list;
        for(auto& nn : nns)
        {
            networks_list.push_back(nn->serialize());
        }

        generate_best_genome_images(ga);

        int species_id = (int)ga.BestGenome().GetSpeciesID();
        std::cout << "Best species id: " << species_id << std::endl;

        json species_map(species_counts);
        message["generation"] = ga.Generation();
        message["best_specie_id"] = species_id;
        message["brains"] = networks_list;
        message["species"] = species_map;
        message["best_so_far"] = ga.BestEverFitness();


        std::string result = message.dump();

        *response << HEAD << "200 OK\r\n"
                  << "Content-Type: application/json\r\n"
                  << "Content-Length: " << result.length() << "\r\n\r\n"
                  << result;
    }
    catch(std::exception& e)
    {
        std::cerr << "Didn't handle /fitness GET: " << e.what() << std::endl;
        *response << HEAD << "400 Bad Request\r\nContent-Length: " << std::strlen(e.what()) << "\r\n\r\n" << e.what();
    }
}


void init_brains_handler(std::shared_ptr<HttpServer::Response> response,
                         std::shared_ptr<HttpServer::Request> request,
                         neat::GenAlg& ga)
{
    using json = nlohmann::json;
    try
    {
        json list;
        auto nns = ga.CreateNeuralNetworks();
        for(auto& nn : nns)
        {
            list.push_back(nn->serialize());
        }

        std::string result = list.dump();

        *response << HEAD << "200 OK\r\n"
                  << "Content-Type: application/json\r\n"
                  << "Content-Length: " << result.length() << "\r\n\r\n"
                  << result;
    }
    catch(std::exception& e)
    {
        std::cerr << "Didn't handle /init_brains GET: " << e.what() << std::endl;
        *response << HEAD << "400 Bad Request\r\nContent-Length: " << std::strlen(e.what()) << "\r\n\r\n" << e.what();
    }
}


/**
 * Send contents of input file stream to the client
 */
void default_resource_send(const HttpServer& server,
                           const std::shared_ptr<HttpServer::Response>& response,
                           const std::shared_ptr<std::ifstream>& ifs)
{
    //read and send 128 KB at a time
    std::shared_ptr<std::vector<char>> buffer = std::make_shared<std::vector<char>>(131072);
    std::streamsize read_length;
    if((read_length=ifs->read(&(*(buffer))[0], buffer->size()).gcount())>0)
    {
        response->write(&(*(buffer))[0], read_length);

        if(read_length == static_cast<std::streamsize>(buffer->size()))
        {
            server.send(response,
                [&server, response, ifs](const boost::system::error_code &ec)
                {
                    if(!ec)
                        default_resource_send(server, response, ifs);
                    else
                        std::cerr << "Connection interrupted" << std::endl;
                }
            );
        }
    }
}
