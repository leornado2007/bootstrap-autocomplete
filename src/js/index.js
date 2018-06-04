$(function () {

  var mails = '126.com,163.com,gmail.com,sina.com,hotmail.com,qq.com,yahoo.com'.split(',').sort();
  var emailLoader = function (searchText, callback) {
    setTimeout(function () {
      var data = [];
      $.each(mails, function (i, domain) {
        data.push(searchText + '@' + domain);
      });
      callback(data);
    }, 500);
  };
  var emailItemsLoader = function (items, callback) {
    setTimeout(function () {
      var checkedItems = [];
      $.each(items, function (i, item) {
        if ((item.c || item.code).indexOf('hua_mu_lan') < 0) checkedItems.push(item);
      });
      callback(checkedItems);
    }, 500);
  };
  var onchange = function (valueId) {
    return function (e, oldValue, newValue) {
      console.log('=====onchange======', valueId);
      $('#' + valueId).text(JSON.stringify(newValue));
    };
  };
  var oninit = function (bsId, valueId) {
    return function () {
      console.log('=====oninit======', bsId);
      var value = $('#' + bsId).data('bsAutoComplete').getValue();
      $('#' + valueId).text(JSON.stringify(value));
    };
  };
  var onselect = onclear = ondeselect = function (eventType, bsId) {
    return function () {
      console.log('====' + eventType + '====', bsId)
    }
  };
  var getListeners = function (bsId, valueId) {
    return {
      'bs.autocomplete.change': onchange(valueId), 'bs.autocomplete.init': oninit(bsId, valueId),
      'bs.autocomplete.select': onselect('onselect', bsId), 'bs.autocomplete.deselect': ondeselect('deselect', bsId),
      'bs.autocomplete.clear': onclear('onclear', bsId)
    }
  };

  // ac1
  $('#ac1').on($.extend({}, getListeners('ac1', 'value1'))).bsAutocomplete({
    minChar: 3, filtSame: true, forceSelect: true,
    loadData: emailLoader, loadDataItems: emailItemsLoader,
    getText4BadgeEdit: function (item, text) {
      return text.indexOf('@') >= 0 ? text.substring(0, text.indexOf('@')) : text
    }
  });

  $('#ac1Btn').click(function () {
    var ac1 = $('#ac1').data('bsAutoComplete');
    ac1.setValue(['snow_white@gmail.com', 'hua_mu_lan@sina.com', 'cinderella@hotmail.com']);
  });

  // ac2
  $('#ac2').on($.extend({}, getListeners('ac2', 'value2'))).bsAutocomplete({
    forceSelect: true, value: ['snow_white@gmail.com', 'Zwerge_1@gmail.com'],
    loadData: emailLoader, loadDataItems: emailItemsLoader,
    getText4BadgeEdit: function (item, text) {
      return text.indexOf('@') >= 0 ? text.substring(0, text.indexOf('@')) : text
    }
  });

  var ZwergeIndex = 1;
  $('#ac2Btn').click(function () {
    var ac2 = $('#ac2').data('bsAutoComplete');
    ac2.addValue(['Zwerge_' + (ZwergeIndex++ % 7 + 1) + '@gmail.com', 'Zwerge_' + (ZwergeIndex++ % 7 + 1) + '@gmail.com']);
  });

  // ac3
  var data = [];
  for (var i = 0; i < 100; i++) data.push({code: 'code-' + i, name: '项目-' + i})
  $('#ac3').on($.extend({}, getListeners('ac3', 'value3'))).bsAutocomplete({
    minChar: 0, data: data
  });

  $('#ac3Btn').click(function () {
    var ac3 = $('#ac3').data('bsAutoComplete');
    ac3.setReadonly(!ac3.isReadonly());
  });

  // ac4
  $('#ac4').on($.extend({}, getListeners('ac4', 'value4'))).bsAutocomplete({
    minChar: 0, data: data, multiple: false
  });

  // ac5
  $('#ac5').on($.extend({}, getListeners('ac5', 'value5'))).bsAutocomplete({
    data: data.concat([{c: 'add value', n: '添加的项目'}, {c: 'set value', n: '设置的项目'}, 'hello world']),
    multiple: false, value: 'hello world', forceSelect: true
  });

  $('#ac5AddBtn').click(function () {
    var ac5 = $('#ac5').data('bsAutoComplete');
    ac5.addValue([{c: 'add value', n: '添加的项目'}]);
  });
  $('#ac5SetBtn').click(function () {
    var ac5 = $('#ac5').data('bsAutoComplete');
    ac5.addValue([{c: 'set value', n: '设置的项目'}]);
  });

});