# Concepts

The purview component model is similar to the elm architecture.
Recall that in the elm architecture the view function takes a callback and a model and returns a view.

```js
const view = (signal, model) => <div>{model}</div>;
```

In purview the view function looks exactly the same but the types are incremental values.

## Incremental Values

An incremental value is a patchable type paired with a change.
Those are called `Jet`s in purview.

Let's see an example of an array `Jet`.

```js
new IArray.Jet(IArray.of([Atomic.of(1), Atomic.of(2)]), [
  InsertAt(0, Atomic.of(3))
]);
```

IArray and Atomic are patchable types.

### Patchable Types

A patchable type is a type that provides a `patch` function that takes a
change description and constructs a new value with the applied changes.
The shape of the change description is specific to the type.
For arrays it is an array of operations.

For example:

```js
const xs = IArray.of([Atomic.of(1), Atomic.of(2)]);
const ys = xs.patch([InsertAt(0, Atomic.of(3))]);
// ys -> IArray([Atomic.of(3), Atomic.of(1), Atomic.of(2)])
```

### IArray Change Description

A change description for an array is an array of operations that should be performed on the array in sequence. Purview defines the following operations:

```js
InsertAt(index, value);
DeleteAt(index);
ModifyAt(index, patch);
```

Every array operation references a specific position in the array by index.
InsertAt contains the value to insert (which can be any patchable type).
ModifyAt contains a change description for the patchable type at that index.

### Incremental array mapping

When we map over an ordinary array we apply a function to every element of the array.
Mapping over an incremental array means that we also need to map the change description.

Consider the array from above:

```js
new Array.Jet(IArray.of([Atomic.of(1), Atomic.of(2)]), [
  InsertAt(0, Atomic.of(3))
]);
```

If we want to apply a function that turns every item into a string like this:

```js
const numberToString = x => "the number is " + x;
```

then intuitively the result should be

```js
new IArray.Jet(
  IArray.of([Atomic.of("the number is 1"), Atomic.of("the number is 2")]),
  [InsertAt(0, Atomic.of("the number is 3"))]
);
```

So we need to apply the function to the value to be inserted, no big deal.
It gets more tricky when we have to map a ModifyAt operation.
Consider this array jet:

```js
new IArray.Jet(IArray.of([Atomic.of(1), Atomic.of(2)]), [
  ModifyAt(1, Last.of(42))
]);
```

Note how we don't actually have a value in the ModifyAt operation but a change description for the item at the given index.
So the result of mapping the above function should be:

```js
new IArray.Jet(
  IArray.of([Atomic.of("the number is 1"), Atomic.of("the number is 2")]),
  [ModifyAt(1, Last.of("the number is 42"))]
);
```

In this example the values inside the array are `Atomic`s but they could be any other patchable type.
Therefore our mapping function needs to take a `Jet` of the appropriate type of value and return a `Jet` of any other type.

```js
// x must be an Atomic.Jet
// Atomic.Jet.map applies the function to the value and the change
// returning a new Atomic.Jet

const numberToString = x => x.map(n => "the number is " + n);
```

Given a mapping function like this `IArray.Jet.map` will use the value of the resulting `Jet` to map `InsertAt` operations and the velocity to map `ModifyAt` operations.

```js
  ModifyAt: (index, patch) => {
    // patch the value at index with the given patch
    // to obtain a new value
    const newValue = xs[index].patch(patch);

    // apply the given function to a jet of the new value
    // to obtain the change (velocity) for the new value
    const newPatch = f(newValue.asJet(patch)).velocity

    velocity.push(ModifyAt(index, newPatch);
    xs[index] = newValue;
  }
```
