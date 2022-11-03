<p>Base utility package that supports requests from <a href="https://github.com/jbystronski/jb-fmanager-react">@jb_fmanager/react</a> in nodejs.</p>

<h4>Install:</h4>

```bash
npm i @jb_fmanager/node-utils

yarn add @jb_fmanager/node-utils
```

<h4>Use:</h4>

<p>Depending on your framework's specs you have to write a route that points to a relevant utility function and pass the right arguments, and that is pretty much all you have to do. Below you can see how to do it in a made up route implementaion, you will have to rewrite it according to your framework's standards.</p>

<strong>[get] map</strong>

<span>Maps the provided path, returns a parent / child tree structure</span>

```js
const { map } = require("@jb_fmanager/node-utils");

app.get("/api/fm/map", async (request, response) => {
  try {
    // expects path argument from the query
    // result is the formatted file tree
    // throws error

    const result = await map(request.query.path);

    // response has to include result as json
  } catch (e) {
    console.error(e);
  }
});
```

<strong>[ge] crate_folder</strong>

<span>Creates new directory in the specified path</span>

```js
const { create_folder } = require("@jb_fmanager/node-utils");

app.get("/api/fm/create_folder", async (request, response) => {
  try {
    // expects path and name arguments from the query
    // void
    // throws error

    await create_folder(request.query.path, request.query.name);

    // any response
  } catch (e) {
    console.error(e);
  }
});
```

<strong>[get] rename</strong>

<span>Renames a file</span>

```js
const { rename } = require("@jb_fmanager/node-utils");

app.get("/api/fm/rename", async (request, response) => {
  try {
    // expects oldPath and newPath arguments from the query
    // void
    // throws error

    await rename(request.query.oldPath, request.query.newPath);

    // any response
  } catch (e) {
    console.error(e);
  }
});
```

<strong>[post] remove</strong>

<span>Removes a number of files recursively</span>

```js
const { remove } = require("@jb_fmanager/node-utils");

app.post("/api/fm/remove", async (request, response) => {
  try {
    // expects the request body
    // void
    // throws error

    await remove(request.body);

    // any response
  } catch (e) {
    console.error(e);
  }
});
```

<strong>[post] copy</strong>

<span>Copies a number of files from one path to another</span>

```js
const { copy } = require("@jb_fmanager/node-utils");

app.post("/api/fm/copy", async (request, response) => {
  try {
    // expects target argument from query and request body
    // void
    // throws error

    await copy(request.query.target, request.body);

    // any response
  } catch (e) {
    console.error(e);
  }
});
```

<strong>[post] move</strong>

<span>Moves a number of files from one path to another</span>

```js
const { move } = require("@jb_fmanager/node-utils");

app.post("/api/fm/move", async (request, response) => {
  try {
    // expects target argument from query and request body
    // void
    // throws error

    await move(request.query.target, request.body);

    // any response
  } catch (e) {
    console.error(e);
  }
});
```

<strong>[post] upload</strong>

<span>Saves a number of files into the given destination</span>

```js
const { upload } = require("@jb_fmanager/node-utils");

app.post("/api/fm/upload", async (request, response) => {
  try {
    // expects request, response, destination and max_size (optional) arguments
    // result is an object with two array properties, one containing succesful and the other containing failed uploads
    // throws error

    const result = await upload(
      request,
      response,
      request.query.destination,
      request.query.max_size
    );

    // response should include the result in json
  } catch (e) {
    console.error(e);
  }
});
```

<p>Upload relies on a multipart/form-data type request. It can vary how your framework handles such requests. It might be passed with no issues or it might be blocked on the way, due reasons such as your framework not supporting multipart data in vanilla form or it may fall half-way when the framework tries to process it through it's default parser. What you should do is to disable the default parser on this specific route or, depending on your framework, add a custom parser or middleware that will pass the request onwards.</p>

```js
// Next.js - blocking default parser on "api/fm/upload" route example

export const config = {
  api: {
    bodyParser: false,
  },
};

// process upload
```

```js
// fastify - adding a custom multipart/form-data parser which will pass the request onwards

const fastify = require("fastify")({});

fastify.addContentTypeParser(
  "multipart/form-data",
  function (request, payload, done) {
    done(null, payload);
  }
);

// then inside your route

upload(request.raw, response.raw, ...)

// in fastify the instance of IncomingMessage can be found under request.raw,

```
