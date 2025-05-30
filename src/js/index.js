$(function () {

  var printEvent = false;
  var mails = '126.com,163.com,gmail.com,sina.com,hotmail.com,qq.com,yahoo.com'.split(',').sort();
  var emailLoader = function (searchText, callback, searchMode, from, loadSeq) {
    if (from) console.log('from:', from);
    setTimeout(function () {
      var data = [];
      $.each(mails, function (i, domain) {
        data.push(searchText + '@' + domain);
      });
      callback(data, loadSeq);
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
      if (printEvent) console.log('=====onchange======', valueId, newValue);
      $('#' + valueId).text(JSON.stringify(newValue));
    };
  };
  var oninit = function (bsId, valueId) {
    return function () {
      if (printEvent) console.log('=====oninit======', bsId);
      var value = $('#' + bsId).data('bsAutoComplete').getValue();
      $('#' + valueId).text(JSON.stringify(value));
    };
  };
  var onselect = onclear = ondeselect = onFocus = onBlur = function (eventType, bsId) {
    return function () {
      if (printEvent) console.log('====' + eventType + '====', bsId)
    }
  };
  var onSetFinish = function (eventType, bsId) {
    return {
      onSetFinish: function () {
        if (printEvent) console.log('====' + eventType + '====', bsId)
      }
    }
  };
  var getListeners = function (bsId, valueId) {
    return {
      'bs.autocomplete.change': onchange(valueId), 'bs.autocomplete.inited': oninit(bsId, valueId),
      'bs.autocomplete.select': onselect('onselect', bsId), 'bs.autocomplete.deselect': ondeselect('deselect', bsId),
      'bs.autocomplete.clear' : onclear('onclear', bsId), 'bs.autocomplete.focus': onFocus('focus', bsId),
      'bs.autocomplete.blur'  : onBlur('blur', bsId)
    }
  };

  // ac1
  $('#ac1').on($.extend(getListeners('ac1', 'value1'), {})).bsAutoComplete({
    minChar          : 3, filtSame: true, forceSelect: true,
    placeHolder      : '请选择请选择请选择请选择请选择请选择请选择请选择请选择请选择请选择请选择请选择请选择请选择请选择',
    loadData         : emailLoader, loadDataItems: emailItemsLoader,
    getText4BadgeEdit: function (item, text) {
      return text.indexOf('@') >= 0 ? text.substring(0, text.indexOf('@')) : text
    }
  });

  $('#ac1Btn').click(function () {
    var ac1 = $('#ac1').data('bsAutoComplete');
    ac1.setValue(['snow_white@gmail.com', 'hua_mu_lan@sina.com', 'cinderella@hotmail.com'], onSetFinish('setValue', 'ac3'));
  });

  // ac2
  $('#ac2').hide().on($.extend(getListeners('ac2', 'value2'), {
    'bs.autocomplete.inited': function () {
      $('#ac2').show();
    }
  })).bsAutoComplete({
    forceSelect      : true, value: ['snow_white@gmail.com', 'Zwerge_1@gmail.com'],
    loadData         : emailLoader, loadDataItems: emailItemsLoader,
    getText4BadgeEdit: function (item, text) {
      return text.indexOf('@') >= 0 ? text.substring(0, text.indexOf('@')) : text
    }
  });

  var ZwergeIndex = 1;
  $('#ac2Btn').click(function () {
    var ac2 = $('#ac2').data('bsAutoComplete');
    ac2.addValue(['Zwerge_' + (ZwergeIndex++ % 7 + 1) + '@gmail.com', 'Zwerge_' + (ZwergeIndex++ % 7 + 1) + '@gmail.com'],
      onSetFinish('addValue', 'ac3'));
  });
  $('#ac2ResizeBtn').click(function () {
    var ac2 = $('#ac2').data('bsAutoComplete');
    ac2.resize();
  });

  // ac3
  var data = [];
  for (var i = 0; i < 100; i++) data.push({code: 'code-' + i, name: '项目-' + i, cls: 'custom-cls'});
  var data2 = [];
  for (var i = 0; i < 100; i++)
    data2.push({code: 'code-' + i, name: '项目-' + i, optGroup: i % 4 === 0, cls: 'custom-cls'});
  $('#ac3').on($.extend(getListeners('ac3', 'value3'), {})).bsAutoComplete({
    minChar: 0, data: data2, filtSame: true
  });

  $('#ac3Btn').click(function () {
    var ac3 = $('#ac3').data('bsAutoComplete');
    ac3.setReadonly(!ac3.isReadonly());
  });
  $('#ac3AddBtn').click(function () {
    var ac3 = $('#ac3').data('bsAutoComplete');
    ac3.addValue([{c: 'code-12', n: '项目-12'}], onSetFinish('addValue', 'ac3'));
  });

  // ac4
  $('#ac4').on($.extend(getListeners('ac4', 'value4'), {})).bsAutoComplete({
    minChar: 0, data: data, multiple: false
  });
  $('#ac4Btn').click(function () {
    var ac4 = $('#ac4').data('bsAutoComplete');
    ac4.setReadonly(!ac4.isReadonly());
  });

  // ac5
  $('#ac5').on($.extend(getListeners('ac5', 'value5'), {})).bsAutoComplete({
    data   : data.concat([{c: 'add value', n: '添加的项目'}, {c: 'set value', n: '设置的项目'}, 'hello world']),
    minChar: 0, multiple: false, forceSelect: true, showAllWhenSingleForceSelectFocus: true, filtSame: true
  });

  $('#ac5AddBtn').click(function () {
    var ac5 = $('#ac5').data('bsAutoComplete');
    ac5.addValue([{c: 'add value', n: '添加的项目'}], onSetFinish('addValue', 'ac5'));
  });
  $('#ac5SetBtn').click(function () {
    var ac5 = $('#ac5').data('bsAutoComplete');
    ac5.setValue([{c: 'set value', n: '设置的项目'}], onSetFinish('setValue', 'ac5'));
  });

  // ac6
  var itemTpl = '<div>\
          <div><span class="badge">{name}</span>:<span class="label label-success">{key}</span></div>\
          <div><span class="alert alert-info">{desc}</span></div>\
      </div>';
  var ac6MetaData = [
    {c: 'id1', od: {name: '设置的项目1', arr: [1, 2], jso: {key: '子项1'}}},
    {c: 'id2', od: {name: '设置的项目2', arr: [1, 2], jso: {key: '子项2'}}}
  ], ac6data = [];
  $.each(ac6MetaData, function (i, n) {
    var name = itemTpl.format({name: n.od.name, key: n.od.jso.key, desc: JSON.stringify(n.od)});
    ac6data.push($.extend({n: n.od.name, hn: name}, n));
  });
  $('#ac6').on(getListeners('ac6', 'value6')).bsAutoComplete({
    data: ac6data,
    cls : 'custom-item-html', minChar: 0, multiple: false, value: 'id2', forceSelect: true, itemUseHtml: true
  });

  $('#ac6SetBtn').click(function () {
    var ac5 = $('#ac6').data('bsAutoComplete');
    ac5.setValue([ac6data[1]], onSetFinish('setValue', 'ac6'));
  });

  // ac7
  var longValue = '';
  for (var i = 0; i < 40; i++) longValue += 'asdf';
  $('#ac7').on($.extend(getListeners('ac7', 'value7'), {})).bsAutoComplete({
    minChar: 0, data: data2, filtSame: true, value: [longValue, longValue + '2']
  });

  $('#ac7Btn').click(function () {
    var ac7 = $('#ac7').data('bsAutoComplete');
    ac7.setReadonly(!ac7.isReadonly());
  });
  $('#ac7AddBtn').click(function () {
    var ac7 = $('#ac7').data('bsAutoComplete');
    ac7.addValue([{c: 'code-12', n: '项目-12'}], onSetFinish('addValue', 'ac7'));
  });

  // ac8
  $('#ac8').on($.extend(getListeners('ac8', 'value8'), {})).bsAutoComplete({
    minChar: 0, data: data, multiple: false, value: [longValue]
  });
  $('#ac8Btn').click(function () {
    var ac8 = $('#ac8').data('bsAutoComplete');
    ac8.setReadonly(!ac8.isReadonly());
  });

  // ac9
  var emailLoaderWzSearchMode = function (searchText, callback, searchMode, from, loadSeq) {
    if (from) console.log('from:', from);
    var data = [];
    if (!!searchMode) data.push({c: 'searchMode-test', n: '搜索模式测试'});
    $.each(mails, function (i, domain) {
      data.push(searchText + '@' + domain);
    });
    callback(data, loadSeq);
  };
  $('#ac9').on($.extend(getListeners('ac9', 'value9'), {})).bsAutoComplete({
    minChar : 0, data: data2, filtSame: true, forceSelect: true,
    loadData: emailLoaderWzSearchMode
  });

  $('#ac9Btn').click(function () {
    var ac9 = $('#ac9').data('bsAutoComplete');
    ac9.setReadonly(!ac9.isReadonly());
  });
  $('#ac9AddBtn').click(function () {
    var ac9 = $('#ac9').data('bsAutoComplete');
    ac9.addValue([{c: 'searchMode-test', n: '搜索模式测试'}], onSetFinish('addValue', 'ac9'));
  });

  // ac10
  var data10 = [];
  for (var i = 0; i < 100; i++) {
    if (i % 4 != 0 && i != 1 && i != 10) continue;
    // if (i % 4 != 0 && i != 1 && i % 10 != 0) continue;
    data10.push({code: 'code-' + i, name: '项目-' + i, optGroup: i % 4 === 0, cls: 'custom-cls'});
  }
  $('#ac10').on($.extend(getListeners('ac10', 'value10'), {})).bsAutoComplete({
    minChar: 0, data: data10, filtSame: true, hideOtherSelected4Multiple: true
  });

  $('#ac10Btn').click(function () {
    var ac10 = $('#ac10').data('bsAutoComplete');
    ac10.setReadonly(!ac10.isReadonly());
  });
  $('#ac10AddBtn').click(function () {
    var ac10 = $('#ac10').data('bsAutoComplete');
    ac10.addValue([{c: 'code-12', n: '项目-12'}], onSetFinish('addValue', 'ac10'));
  });

  // ac11
  var data11 = [];
  for (var i = 0; i < 100; i++) {
    if (i % 4 != 0 && i != 1 && i != 10) continue;
    // if (i % 4 != 0 && i != 1 && i % 10 != 0) continue;
    data11.push({code: 'code-' + i, name: '项目-' + i, optGroup: i % 4 === 0, cls: 'custom-cls'});
  }
  $('#ac11').on($.extend(getListeners('ac11', 'value11'), {})).bsAutoComplete({
    minChar: 0, data: data11, filtSame: true, hideOtherSelected4Multiple: false
  });

  $('#ac11Btn').click(function () {
    var ac11 = $('#ac11').data('bsAutoComplete');
    ac11.setReadonly(!ac11.isReadonly());
  });
  $('#ac11AddBtn').click(function () {
    var ac11 = $('#ac11').data('bsAutoComplete');
    ac11.addValue([{c: 'code-12', n: '项目-12'}], onSetFinish('addValue', 'ac11'));
  });

  $.each(['12', '13'], function (i, acSeq) {
    // ac12, ac13
    $('#ac' + acSeq)
      .on($.extend(getListeners('ac' + acSeq, 'value' + acSeq), {}))
      .bsAutoComplete({
        minChar : 0,
        data    : data2,
        // multiple: false,
        // loadData             : emailLoader,
        filtSame                           : true,
        closeOnSelect                      : false,
        forceSelect                        : false,
        dropDownFollowInputEl              : false,
        hideBadge                          : acSeq === '13',
        disableSelectedItemsInfoDragAnmiate: false,
        mode                               : 'selectOption',
      });

    $('#ac' + acSeq + 'Btn').click(function () {
      var ac = $('#ac' + acSeq).data('bsAutoComplete');
      ac.setReadonly(!ac.isReadonly());
    });
    $('#ac' + acSeq + 'AddBtn').click(function () {
      var ac = $('#ac' + acSeq).data('bsAutoComplete');
      ac.addValue([{c: 'code-13', n: '项目-13'}], onSetFinish('addValue', 'ac' + acSeq));
    });
  });

});
