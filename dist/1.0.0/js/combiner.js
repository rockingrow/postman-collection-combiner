/**
 * Combiner library
 *
 * Description: This file is combiner core
 *
 * @link   https://github.com/rockingrow/postman-collection-combiner
 * @author Quang Huynh
 * @since  1.0.0
 */
'use strict';
/**
 * This function will be found item in array by prop key value
 * @param {array} array Array object
 * @param {string} name prop key
 * @param {string/number} value prop value
 * @returns index number. Default -1
 */

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.combine = exports.isValidCollection = exports.generateOutputName = exports.mergeRootVariable = exports.mergeRootEvent = exports.mergeItem = exports.mergeEvent = void 0;

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0, _defineProperty2["default"])(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

var getIndexBy = function getIndexBy(array, name, value) {
  var found = -1;

  for (var i = 0; i < array.length; i++) {
    if (array[i][name] === value) {
      found = i;
      break;
    }
  }

  return found;
};
/** 
 * This function will be merged sub events into main events
 * Rules:
 * - If sub is empty: return m
 * - If m is empty: return s
 * @param {array} m main event
 * @param {array} s sub event
 * @returns merged event array
 */


var mergeEvent = function mergeEvent(m, s) {
  if (typeof s === "undefined" || s.length === 0) return m;
  if (typeof m === "undefined") return s;
  s.forEach(function (event) {
    //Check m has existed event
    var mIndex = getIndexBy(m, "listen", event.listen);

    if (mIndex < 0) {
      //Not existed
      m.push(event);
    } else {
      //Existed
      //Check exist script
      if (event.script && m[mIndex].script) {
        //Check same type. Ex: text/javascript
        if (event.script.type === m[mIndex].script.type) {
          //Check exist exec array
          if (event.script.exec && m[mIndex].script.exec) {
            event.script.exec.forEach(function (e) {
              if (e !== "") {
                //Push s event exec into m event exec by comment text
                m[mIndex].script.exec.push("//".concat(e));
              }
            });
          }
        }
      }
    }
  });
  return m;
};
/**
 * This Recursive function will be merged sub items into main items. Loop deeply folder/item in main-sub array
 * @param {object} m items
 * @param {object} s items
 * @returns merged object
 */


exports.mergeEvent = mergeEvent;

var mergeItem = function mergeItem(m, s) {
  if (typeof s.item !== "undefined") {
    s.item.forEach(function (item) {
      var mItemIndex = m.item ? getIndexBy(m.item, "name", item.name) : -1;

      if (mItemIndex < 0) {
        //Not found this item in mItem => push into mItem
        m = _objectSpread(_objectSpread({}, m), {}, {
          item: [].concat((0, _toConsumableArray2["default"])(m.item), [item])
        });
      } else {
        //Existed this item
        if (m.item[mItemIndex].item && item.item) {
          //Update auth, event
          var sAuth = item.auth || {};
          m.item[mItemIndex] = _objectSpread(_objectSpread({}, m.item[mItemIndex]), {}, {
            auth: m.item[mItemIndex].auth || sAuth,
            event: mergeEvent(m.item[mItemIndex].event, item.event)
          }); //Continue loop item and merge deeply

          m.item[mItemIndex] = mergeItem(m.item[mItemIndex], item);
        }
      }
    });
  }

  return m;
};
/**
 * This function will be merge sub root events into main root events.
 * @param {array} m main root events
 * @param {array} s sub root events
 * @returns merged events
 */


exports.mergeItem = mergeItem;

var mergeRootEvent = function mergeRootEvent(m, s) {
  return s.event ? _objectSpread(_objectSpread({}, m), {}, {
    event: mergeEvent(m.event, s.event)
  }) : m;
};
/**
 * This function will be merge sub root events into main root events.
 * @param {array} m main root events
 * @param {array} s sub root events
 * @returns merged events
 */


exports.mergeRootEvent = mergeRootEvent;

var mergeRootVariable = function mergeRootVariable(m, s) {
  if (typeof s.variable === "undefined" || s.variable.length === 0) return m;
  if (typeof m.variable === "undefined" || m.variable.length === 0) return _objectSpread(_objectSpread({}, m), {}, {
    variable: (0, _toConsumableArray2["default"])(s.variable)
  });
  s.variable.forEach(function (v) {
    //Check m has existed variable
    if (getIndexBy(m.variable, "key", v.key) < 0) {
      m = _objectSpread(_objectSpread({}, m), {}, {
        variable: [].concat((0, _toConsumableArray2["default"])(m.variable), [v])
      });
    }
  });
};
/**
 * This function will be renamed collection name prop (collection.info.name) with prefix (date time)
 * @param {object} m collection
 * @param {string} name *not require this field. Default is date time iso string
 * @returns renamed collection object
 */


exports.mergeRootVariable = mergeRootVariable;

var generateOutputName = function generateOutputName(m) {
  var name = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
  return m ? _objectSpread(_objectSpread({}, m), {}, {
    info: _objectSpread(_objectSpread({}, m.info), {}, {
      name: name ? name : "".concat(m.info.name, "_").concat(new Date().toISOString())
    })
  }) : m;
};
/**
 * This function will be checked collection has contain require props
 * {
  "info": {
    "_postman_id": "87214ad6-5a7b-47c9-9a0e-3d022d47e189",
    "name": "Webs",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [],
  "event": [],
  "variable": []
  }
 * @param {object} collection
 * @returns boolean valid/invalid
 */


exports.generateOutputName = generateOutputName;

var isValidCollection = function isValidCollection(collection) {
  if (typeof collection === "undefined" || typeof collection.info === "undefined" || typeof collection.item === "undefined") {
    return false;
  }

  return true;
};
/**
 * Combine all processes in one
 * @param {object} m main collection (required)
 * @param {*} s sub collection (required)
 * @param {*} name new collection name prop (not required)
 * @returns
 *  {boolean} success: process successful or not
 *  {object} result: merged collection
 *  {string} message: error message. Undefined if process do not have error
 */


exports.isValidCollection = isValidCollection;

var combine = function combine(m, s) {
  var name = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;

  try {
    if (!isValidCollection(m)) throw new Error("Main collection is not valid");
    if (!isValidCollection(s)) throw new Error("Sub collection is not valid"); //Merge items

    var result = mergeItem(m, s); //Merge root event

    result = mergeRootEvent(result, s); //Merge root variable

    result = mergeRootVariable(result, s);
    return {
      success: true,
      result: generateOutputName(result, name)
    };
  } catch (error) {
    return {
      success: false,
      message: error
    };
  }
};

exports.combine = combine;