# mobx-requestor

# What is this?

This is an abstraction over a resource request for mobx. It aims to make it simpler to deal with the data fetching and posting using any abstraction to perform the request/posts
# How do I use it?

```ts
// simpler example
const rq = new MobxRequestor({
  call: (...args) => {
    // service.someMethod is just a function that returns a 
    // promise to resolve to the data being fetched or to 
    // the result of a POST/PUT/PATCH operation
    return service.someMethod(...args);
  }
});

// although this function return a promise
// it is guaranteed to always resolve 
// the data or error can be inspected on the 
// `error` and `response` properties respectively
await rq.execCall({ someArg: 1 });

// query the state of the request
rq.loading // true if the request is in progress

// if an error ocurred the error can be found here (as text)
rq.error

// if the request finalized without throwing then this will be true
rq.success

// whatever was resolved from the service.someMethod function 
// will be available in this property
req.response 

```
## Building the repo

```sh
npm run build
```

## Type-checking the repo

```sh
npm run type-check
```

And to run in `--watch` mode:

```sh
npm run type-check:watch
```

## License
MIT

## tests
TODO