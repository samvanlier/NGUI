# Virtual Personal Trainer
**Sam Van Lier - sam.van.lier@vub.be**,
**Nick van Hurck - nick.van.hurck@vub.be**,
**Mark Stevic - mark.stevic@vub.be**

2020-2021
---
This project presents an implementation of a Virtual Personal Trainer build on top of [Posenet](https://github.com/tensorflow/tfjs-models/tree/master/posenet) and was made for the course Next Generation User Interfaces at the VUB.
Here you will find a technical overview on the setup, browser support and references to the different sources used (in the code you will also find links to the different repositories and others sources).

Below you will find the following:
- [Project Setup](#project-setup)
- [Docker Setup](#docker)
- [Browser Support](#browser-support)
- [Used libraries](#used-libraries)
---
## Project setup
To setup the project, the first step is to install nodejs and run the following command 
```
npm install
```
Errors that involve upstream dependency conflicts could appear but can be solved by running the following

```
npm install --legacy-peer-deps
```

### Compiles and hot-reloads for development
To run a development version in a terminal, run the following code.
```
npm run serve
```
This provides hot-reloads, it rebuilds the application when a file is saved.

### Compiles and minifies for production
```
npm run build
```
Only useful when building a production ready application (e.g. in a Docker)

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).

## Docker
Docker support has been provided so that long term use and deployment is more easy to do.
Vuejs is not that easy to deploy on different types of servers, Docker is.

To build and run the docker do following code
````sh
# build the docker image
docker build . -t virtual-trainer

# run the image
docker run -d -p 8080:80 virtual-trainer
````
Then go to localhost:8080

You can change the port to your liking.

## Browser Support
At this moment, the support for this application is limited to [Google Chrome](https://www.google.com/intl/nl/chrome/).
This is due to the limited support of the speech recognition  which is provided by the [Web Speech Api](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API).

## Used Libraries
For the project we used two major external packages.
First we used [Posenet](https://github.com/tensorflow/tfjs-models/tree/master/posenet) which is build with [Tensorflow.js](https://www.tensorflow.org/js/).
This is used for the body tracking.

Second we used the [Web Speech Api](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API) which is part of JavaScript.
This is used for the Text-2-Speech and the speech recognition.

All other packages used are need because of the previous dependencies or are part of VueJs which is the framework used to build the project.