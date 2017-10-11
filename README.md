# bookshelf-cls-transaction
A [bookshelf](https://www.npmjs.com/package/bookshelf) plugin
that uses [continuation-local-storage](https://www.npmjs.com/package/continuation-local-storage)
to store transactions into call stack context.
So you don't need to pass transaction into every method,
that must be under transaction. This plugin does this automatically.

## Examples
Without this plugin:
```javascript
const user = await bookshelf.transaction(async (trx) => {
  const club = await new Club({ name: 'The Foos' })
    .save(null, { transacting: trx });
  const user = await new User({ name: 'Sam', club_id: club.id })
    .save(null, { transacting: trx });
  return user;
});
```

With this plugin:
```javascript
const user = await bookshelf.transaction(async () => {
  const club = await new Club({ name: 'The Foos' }).save();
  const user = await new User({ name: 'Sam', club_id: club.id }).save();
  return user;
});
```

## Installation
Install with npm:
```shell
npm i bookshelf-cls-transaction
```

Add plugin to your bookshelf:
```javascript
bookshelf.plugin(require('bookshelf-cls-transaction'));
```

