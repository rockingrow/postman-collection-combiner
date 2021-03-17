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
const getIndexBy = (array, name, value) => {
  let found = -1;
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
const mergeEvent = (m, s) => {
  if (typeof s === "undefined" || s.length === 0) return m;
  if (typeof m === "undefined") return s;
  s.forEach(event => {
    //Check m has existed event
    const mIndex = getIndexBy(m, "listen", event.listen);
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
            event.script.exec.forEach(e => {
              if (e !== "") {
                //Push s event exec into m event exec by comment text
                m[mIndex].script.exec.push(`//${e}`);
              }
            });
          }
        }
      }
    }
  });

  return m;
}

/**
 * This Recursive function will be merged sub items into main items. Loop deeply folder/item in main-sub array
 * @param {object} m items
 * @param {object} s items
 * @returns merged object
 */
const mergeItem = (m, s) => {
  if (typeof s.item !== "undefined") {
    s.item.forEach(item => {
      const mItemIndex = m.item ? getIndexBy(m.item, "name", item.name) : -1;
      if (mItemIndex < 0) {
        //Not found this item in mItem => push into mItem
        m = {
          ...m,
          item: [
            ...m.item,
            item
          ]
        };
      } else {
        //Existed this item
        if (m.item[mItemIndex].item && item.item) {
          //Update auth, event
          const sAuth = item.auth || {};
          m.item[mItemIndex] = {
            ...m.item[mItemIndex],
            auth: m.item[mItemIndex].auth || sAuth,
            event: mergeEvent(m.item[mItemIndex].event, item.event)
          };

          //Continue loop item and merge deeply
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
const mergeRootEvent = (m, s) => {
  return s.event ?
    {
      ...m,
      event: mergeEvent(m.event, s.event)
    }
    : m;
};

/**
 * This function will be merge sub root events into main root events.
 * @param {array} m main root events
 * @param {array} s sub root events
 * @returns merged events
 */
const mergeRootVariable = (m, s) => {
  if (typeof s.variable === "undefined" || s.variable.length === 0) return m;
  if (typeof m.variable === "undefined" || m.variable.length === 0) return { ...m, variable: [...s.variable] };
  s.variable.forEach(v => {
    //Check m has existed variable
    if (getIndexBy(m.variable, "key", v.key) < 0) {
      m = {
        ...m,
        variable: [
          ...m.variable,
          v
        ]
      };
    }
  });
};

/**
 * This function will be renamed collection name prop (collection.info.name) with prefix (date time) or input name
 * @param {object} m collection
 * @param {string} name *not require this field.
 * @returns renamed collection object
 */
const generateOutputName = (m, name = null) => {
  return m ? {
    ...m,
    info: {
      ...m.info,
      name: name ? name : `${m.info.name}_${new Date().toISOString()}`
    }
  } : m;
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
const isValidCollection = collection => {
  if (
    typeof collection === "undefined" ||
    typeof collection.info === "undefined" ||
    typeof collection.item === "undefined"
  ) {
    return false;
  }
  return true;
};

/**
 * Combine all processes in sequence
 * @param {object} m main collection (required)
 * @param {*} s sub collection (required)
 * @param {*} name new collection name prop (not required)
 * @returns
 *  {boolean} success: process successful or not
 *  {object} result: merged collection
 *  {string} message: error message. Undefined if process do not have error
 */
const combine = (m, s, name = null) => {
  try {
    if (!isValidCollection(m)) throw new Error(`Main collection is not valid`);
    if (!isValidCollection(s)) throw new Error(`Sub collection is not valid`);

    //Merge items
    let result = mergeItem(m, s);

    //Merge root event
    result = mergeRootEvent(result, s);

    //Merge root variable
    result = mergeRootVariable(result, s);

    return {
      success: true,
      result: generateOutputName(result, name)
    };
  } catch (error) {
    return {
      success: false,
      message: error
    }
  }
}

export {
  mergeEvent,
  mergeItem,
  mergeRootEvent,
  mergeRootVariable,
  generateOutputName,
  isValidCollection,
  combine
};