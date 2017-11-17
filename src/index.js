import cls from 'continuation-local-storage';
import clsBluebird from  'cls-bluebird';
import _ from 'lodash';

const ns = cls.createNamespace('bookshelf-sessions');
const TRANSACTION_KEY = 'trx';

const getCurrentTransaction = () => ns.get(TRANSACTION_KEY);

const isUnderTransaction = () => getCurrentTransaction() !== undefined;

const withTransaction = (options = {}) => {
  if (isUnderTransaction()) {
    return {
      transacting: getCurrentTransaction(),
      ...options,
    };
  }
  return options;
};


module.exports = (bookshelf) => {
  // Patch Bluebird to work correctly with cls
  clsBluebird(ns);

  bookshelf.Model = bookshelf.Model.extend({
    save: function (key, val, options) {
      const save = bookshelf.Model.__super__.save;

      if (key === null || key === undefined || typeof key === "object") {
        return save.call(this, key, withTransaction(val));
      }

      return save.call(this, key, val, withTransaction(options));
    },
    destroy: function (options) {
      return bookshelf.Model.__super__.destroy
        .call(this, withTransaction(options));
    },
    fetch: function (options) {
      return bookshelf.Model.__super__.fetch
        .call(this, withTransaction(options));
    },
    fetchAll: function (options) {
      return bookshelf.Model.__super__.fetchAll
        .call(this, withTransaction(options));
    },
    load: function (relations, options) {
      return bookshelf.Model.__super__.load
        .call(this, relations, withTransaction(options));
    },
  });

  bookshelf.Collection = bookshelf.Collection.extend({
    attach: function (ids, options) {
      return bookshelf.Collection.__super__.attach
        .call(this, ids, withTransaction(options));
    },
    detach: function (ids, options) {
      return bookshelf.Collection.__super__.detach
        .call(this, ids, withTransaction(options));
    },
    create: function (model, options) {
      return bookshelf.Collection.__super__.create
        .call(this, model, withTransaction(options));
    },
    fetchOne: function (options) {
      return bookshelf.Collection.__super__.fetchOne
        .call(this, withTransaction(options));
    },
    fetch: function (options) {
      return bookshelf.Collection.__super__.fetch
        .call(this, withTransaction(options));
    },
    load: function (relations, options) {
      return bookshelf.Collection.__super__.load
        .call(this, relations, withTransaction(options));
    },
    updatePivot: function (attributes, options) {
      return bookshelf.Collection.__super__.updatePivot
        .call(this, attributes, withTransaction(options));
    },
    count: function (column, options) {
      const count = bookshelf.Collection.__super__.count;

      if (!_.isString(column)) {
        return count.call(this, withTransaction(options));
      }

      return count.call(this, column, withTransaction(options));
    },
  });

  bookshelf._originalTransaction = bookshelf.transaction;

  bookshelf.transaction = function (callback) {
    return this._originalTransaction(trx => (
      ns.runAndReturn(() => {
        if(isUnderTransaction()){
          return getCurrentTransaction().transaction((nestedTrx) => {
            ns.runAndReturn(() => {
              ns.set(TRANSACTION_KEY, nestedTrx);
              return callback(nestedTrx);
            })
          });
        }
        else {
          ns.set(TRANSACTION_KEY, trx);
          return callback(trx);
        }
      })
    ))
  };
};
