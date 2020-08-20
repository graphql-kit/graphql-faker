# Heroku deployment graphql-faker

We are going to create a package and deploy it to Heroku.

# Create your sdl schema

The graphql `SDL` schema is the basis of graphql-faker. If you have the schema in `JSON`, you will need to convert it to `SDL`. We've added the utility to do that right here.

## JSON to SDL

```
yarn convert-graphql-json
```

# Pre deploy

First. Create your app on Heroku. You will need the Heroku app name, e.g. `graphql-faker-1`.

You will need to be logged in to Heroku container registry on the command line.

```
heroku container:login
```

# Deploy

The steps here are:

* Create a graphql-faker image that includes the created graphql schema.
* Deploy that image to the heroku image registry.
* Run the image and test locally
* Access the image at `https://<HEROKU APP NAME>/herokuapp.com/graphql`

```
cd examples/heroku
docker build .
docker run -d -p 9002:9002 <IMAGEID>
docker tag <IMAGEID> registry.heroku.com/<HEROKU APP NAME>/web
docker push registry.heroku.com/<HEROKU APP NAME>/web
heroku ps:scale web=1
```

Shoutout to [graphql-ufc-api](https://github.com/jgcmarins/graphql-ufc-api) where we got the demo schema.

# FAQ

## How do I get the docker image ID?

Run `docker image ls`.
