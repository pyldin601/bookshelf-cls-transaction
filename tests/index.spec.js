const Knex = require('knex');
const Bookshelf = require('bookshelf');

const knex = Knex({
  client: 'sqlite3',
  connection: {filename: ':memory:'},
  useNullAsDefault: true,
  debug: false,
});

const bookshelf = Bookshelf(knex);
const clsTransaction = require('../src');

bookshelf.plugin(clsTransaction);

let User, Club;

beforeAll(async () => {
  await knex.schema.createTable('clubs', function (table) {
    table.increments();
    table.string('name').notNullable().unique();
  });

  await knex.schema.createTable('users', function (table) {
    table.increments();
    table.string('name').notNullable().unique();
    table.integer('club_id').references('clubs.id');
  });

  User = bookshelf.Model.extend({
    tableName: 'users',

    club() {
      return this.belongsTo(Club);
    },
  });

  Club = bookshelf.Model.extend({
    tableName: 'clubs',
  });
});

describe('Test backward compatibility', () => {
  it('Without transaction', async () => {
    await new User({ name: 'Mr. Smith' }).save();
  });

  it('Use transaction as usually', async () => {
    await bookshelf.transaction(async (trx) => {
      await new User({ name: 'Mr. Doe' }).save(null, { transacting: trx });
    });
  });
});

describe('Test cls transactions: Model', () => {
  it('.save() and .destroy()', async () => {
    await bookshelf.transaction(async () => {
      new User({ name: 'Bob Smith' }).save();
      new User().where({ name: 'Bob Smith' }).destroy();
    });
  });

  it('.fetch()', async () => {
    await bookshelf.transaction(() => new User().fetch());
  });

  it('.fetchAll()', async () => {
    await bookshelf.transaction(async () => (
      new User().fetchAll()
    ));
  });

  it('.load()', async () => {
    await bookshelf.transaction(async () => {
      const club = await new Club({ name: 'The Foos' }).save();
      const user = await new User({ name: 'Sam', club_id: club.id }).save();
      await user.load('club');
    });
  });
});
