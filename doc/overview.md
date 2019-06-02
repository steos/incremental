# Overview

Before we can understand [purescript-purview](https://github.com/paf31/purescript-purview) we need to understand the foundation. That is the [purescript-incremental-functions](https://github.com/paf31/purescript-incremental-functions) package on which purview is based.

## incremental-functions

The core of `incremental-functions` is the typeclass:

```
class Monoid d <= Patch a d | a -> d where
  patch :: a -> d -> a
```

This is kind of like saying we have a "patchable" interface that can be satisfied by any type by implementing the patch function which takes a type `a` and a type `d` (this is a value describing the change to the value of type `a`) and returns another (or the same) value of type `a` and `d` must be a monoid.

This makes more sense if we look at a concrete example.

### [Atomic](https://github.com/paf31/purescript-incremental-functions/blob/master/src/Data/Incremental/Eq.purs#L19)

The simplest "patchable" type is called `Atomic` which just wraps any arbitrary value. The data structure to describe a patch delta for `Atomic` is a `Last` which is a newtype wrapper around `Maybe` with last-wins append (semigroup) implementation.

```
instance patchAtomic :: Patch (Atomic a) (Last a) where
  patch x (Last Nothing) = x
  patch _ (Last (Just y)) = Atomic y
```

so in JavaScript terms this could look like

```
class Atomic {
    patch(newValue) {
        return newValue == null ? this : new Atomic(delta)
    }
}
```

So in this case the value describing the "change" is a "new" value and we just return the same value unchanged if there is no new value. Otherwise we wrap the new value.

Example:

```
const x = new Atomic(1)
const y = x.patch(2)
const z = y.patch(null)
```

### [IArray](https://github.com/paf31/purescript-incremental-functions/blob/master/src/Data/Incremental/Array.purs)

`IArray` wraps ordinary arrays. The type to describe the "change" is an array of `ArrayChange`s:

```
data ArrayChange a da
  = InsertAt Int a
  | DeleteAt Int
  | ModifyAt Int da
```

and the "patchable" interface:

```
instance patchIArray
    :: Patch a da
    => Patch (IArray a) (Array (ArrayChange a da)) where
  patch (IArray xs) = IArray <<< foldl patchOne xs where
    patchOne xs_ (InsertAt i x)   = fromMaybe xs_ (Array.insertAt i x xs_)
    patchOne xs_ (DeleteAt i)     = fromMaybe xs_ (Array.deleteAt i xs_)
    patchOne xs_ (ModifyAt i da)  = fromMaybe xs_ (Array.modifyAt i (_ `patch` da) xs_)
```

so `patch` takes a list of changes and applies them immutably to create a new IArray with all the changes applied.

### [Jet](https://github.com/paf31/purescript-incremental-functions/blob/096930c94bdaede2a6fb83669065ccf7bc042f7e/src/Data/Incremental.purs#L72)

A Jet is

> a value (`position`) paired with a change (`velocity`).

Jets are the basis for incremental functions like `IArray.map` and purview components.

In the Purescript implementation a `Jet` is a type alias for a record:

```
type Jet a =
  { position :: a
  , velocity :: Change a
  }
```

so it has a `position` of some type `a` and a `velocity` of some type `Change a`.
The `Change` type is used for type level coercion, so when we see a concrete signature like

```
Jet (Atomic Int)
```

is equivalent to

```
{ position :: Atomic Int
, velocity :: Last Int }
```

and

```
Jet (IArray (Atomic Int))
```

this is equivalent to

```
{ position :: IArray Int
, velocity :: Array (ArrayChange Int (Last Int)) }
```

## purview

At the core of purview is a data structure to describe a DOM element and another to describe the changes to a DOM element. Those are the [`View`](<(https://github.com/paf31/purescript-purview/blob/7031081163f0bd6c131099b8bbcfc38af51579d5/src/Purview.purs#L48)>) and [`ViewChanges`](<(https://github.com/paf31/purescript-purview/blob/7031081163f0bd6c131099b8bbcfc38af51579d5/src/Purview.purs#L59)>) types.
Both of those types are newtype wrappers around records:

```
newtype View eff = View
  { element  :: String
  , text     :: Atomic String
  , attrs    :: IMap String (Atomic String)
  , handlers :: IMap String (Atomic (EventListener eff))
  , kids     :: IArray (View eff)
  }

newtype ViewChanges eff = ViewChanges
  { text     :: Last String
  , attrs    :: MapChanges String (Atomic String) (Last String)
  , handlers :: MapChanges String (Atomic (EventListener eff)) (Last (EventListener eff))
  , kids     :: Array (ArrayChange (View eff) (ViewChanges eff))
  }
```

### [Component](https://github.com/paf31/purescript-purview/blob/7031081163f0bd6c131099b8bbcfc38af51579d5/src/Purview.purs#L238)

A purview component is an incremental function, i.e. it operates on `Jet`s.
It takes two parameters: a Jet containing a model (for example an IArray) and a Jet of an Atomic that contains a callback.
The return value is a Jet of `View`s.

> A component takes a changing update function, and a changing `model`
> and returns a changing `View`. The update function receives a `Change` to
> the model and applies it.

```
type Component model eff
   = Jet (Atomic (Change model -> Eff eff Unit))
  -> Jet model
  -> Jet (View eff)
```

### The Loop

The callback function passed to the component receives an appropriate change value to the model and patches the model.
With the new model the component function is called again which produces a `ViewChange` of the view which is then applied to the DOM.
