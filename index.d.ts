import knex = require('knex');
import BlueBird = require('bluebird');

interface Bookshelf extends Bookshelf.Events<any> {
  transaction<T>(callback: (transaction?: knex.Transaction) => BlueBird<T>): BlueBird<T>;
}

declare function Bookshelf(knex: knex): Bookshelf;

declare namespace Bookshelf {
  abstract class Events<T> {
  }
}

export = Bookshelf;
