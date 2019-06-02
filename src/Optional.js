export default class Optional {
  constructor(x) {
    this.value = x;
  }
  fmap(f) {
    return this.value != null ? new Optional(f(this.value)) : this;
  }
  getWithDefault(x) {
    return this.value != null ? this.value : x;
  }
  whenPresent(f) {
    if (this.value != null) f(this.value);
  }
  isNone() {
    return this.value == null;
  }
  isSome() {
    return this.value != null;
  }

  static Some = x => {
    if (x == null) throw new Error();
    return new Optional(x);
  };

  static None = new Optional(null);

  static of = x => {
    if (x instanceof Optional) return x;
    return x == null ? Optional.None : Optional.Some(x);
  };
}

export class Last {
  constructor(x) {
    this.value = x;
  }
  append(other) {
    return other.value.isSome() ? other : this;
  }
  fmap(f) {
    return new Last(this.value.fmap(f));
  }
  getWithDefault(x) {
    return this.value.getWithDefault(x);
  }
  whenPresent(f) {
    this.value.whenPresent(f);
  }
  isNone() {
    return this.value.isNone();
  }
  isSome() {
    return this.value.isSome();
  }
  static of(x) {
    if (x instanceof Last) return x;
    return new Last(Optional.of(x));
  }
}
