#include <fstream>

#include <boost/filesystem.hpp>

#include <simple-web-server/server_http.hpp>
#include <neatnet/genalg.h>


using HttpServer = SimpleWeb::Server<SimpleWeb::HTTP>;


void default_resource_send(const HttpServer &server, const std::shared_ptr<HttpServer::Response> &response,
                           const std::shared_ptr<std::ifstream> &ifs);

int main(int argc, const char* argv[])
{
    HttpServer server;
    server.config.port = 8080;


    server.default_resource["GET"] = [&server](std::shared_ptr<HttpServer::Response> response,
                                               std::shared_ptr<HttpServer::Request> request)
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
    };

    std::thread server_thread([&server]()
    {
        server.start();
    });

    std::this_thread::sleep_for(std::chrono::seconds(1));

    server_thread.join();

    return 0;
}


void default_resource_send(const HttpServer &server,
                           const std::shared_ptr<HttpServer::Response> &response,
                           const std::shared_ptr<std::ifstream> &ifs)
{
    //read and send 128 KB at a time
    std::vector<char> buffer(131072); // Safe when server is running on one thread
    std::streamsize read_length;
    if((read_length=ifs->read(&buffer[0], buffer.size()).gcount())>0)
    {
        response->write(&buffer[0], read_length);

        if(read_length == static_cast<std::streamsize>(buffer.size()))
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
