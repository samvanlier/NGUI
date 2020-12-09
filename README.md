# ngui

## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).

## Docker
to build and run the docker do following code
````sh
# build the docker image
docker build . -t virtual-trainer

# run the image
docker run -d -p 8080:80 virtual-trainer
````
Then go to localhost:8080

