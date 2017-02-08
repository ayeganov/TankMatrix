#include <fstream>

#include <boost/filesystem.hpp>
#include "json.hpp"

#include <simple-web-server/server_http.hpp>
#include <neatnet/params.h>
#include <neatnet/genalg.h>


using HttpServer = SimpleWeb::Server<SimpleWeb::HTTP>;


const std::string HEAD = "HTTP/1.1 ";
const int NUM_INPUTS = 11;
const int NUM_OUTPUTS = 2;


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

        auto nns = ga.CreateNeuralNetworks();
        auto first = nns[0];
        auto outputs = first->Update({0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8,0.9,0.10,0.11});

        std::cout << "Network output: ";
        for(auto out : outputs)
        {
            std::cout << out << ", ";
        }
        std::cout << std::endl;

        json network = nns[0]->serialize();

        std::string result = network.dump();
        *response << HEAD << "200 OK\r\n"
                  << "Content-Type: application/json\r\n"
                  << "Content-Length: " << result.length() << "\r\n\r\n"
                  << result;
    }
    catch(std::exception& e)
    {
        std::cerr << "Didn't handle /fitness POST: " << e.what() << std::endl;
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
        std::cerr << "Didn't handle /fitness POST: " << e.what() << std::endl;
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
