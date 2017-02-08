cmake_minimum_required(VERSION 3.0)
project(TankMatrix)

add_definitions(-std=c++14)

include_directories(include)
# Resolve includes and required packages here
set(BOOST_ROOT /usr/include/boost)
set(BOOST_COMPONENTS system thread filesystem date_time)
find_package(OpenCV REQUIRED)
find_package(Boost COMPONENTS ${BOOST_COMPONENTS} REQUIRED)
include_directories(${OpenCV_INCLUDE_DIRS})
include_directories(SYSTEM ${Boost_INCLUDE_DIR})

include_directories(${CMAKE_CURRENT_SOURCE_DIR}/include)

# Create file sets
set(SRC_FILES src/main.cpp)
set(INCLUDE_FILES "")

# Setup testing
enable_testing()
add_subdirectory(tests)

# Put executables here
add_executable(main src/main.cpp)
target_link_libraries(main NeatNet_1.0.0 ${OpenCV_LIBS})
target_link_libraries(main ${Boost_LIBRARIES})
target_link_libraries(main ${CMAKE_THREAD_LIBS_INIT})

# Copy over web files
file(COPY web DESTINATION ${CMAKE_CURRENT_BINARY_DIR})

set(VERSION 1.0.0)
