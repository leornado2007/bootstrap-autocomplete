(function ($) {
  'use strict';

  // DEF_OPTS
  var DEF_OPTS = {
    cls             : '',
    placeHolder     : '请选择',
    searchMode      : 'code name',
    ignoreCase      : true,
    fitWdith        : true,
    dropUp          : false,
    filtSame        : false,
    badgeCls        : '',
    dblclick4Edit   : false,
    inputSearchDelay: 200,
    forceSelect     : false,
    minChar         : 1,
    multiple        : true,
    debounceFn      : function (delay, fn, atBegin) {
      if ($.debounce) return $.debounce(delay, atBegin, fn);
      else {
        var mockDebounceTimeout = -1, lastTimeoutId = -1;
        return function () {
          var now = +new Date().getTime();
          if (mockDebounceTimeout < 0 || (now - mockDebounceTimeout) > delay) {
            mockDebounceTimeout = now;

            if (lastTimeoutId > 0) {
              clearTimeout(lastTimeoutId);
              lastTimeoutId = -1;
            }

            lastTimeoutId = setTimeout(function () {
              lastTimeoutId = -1;
              mockDebounceTimeout = -1;
              fn();
            }, delay);
          }
        }
      }
    }
  };

  var isIE = navigator.userAgent.indexOf('Trident') > -1;

  // KEY_CODES
  var KEY_CODES = {
    ENTER: 13, TAB: 9, LEFT: 37, UP: 38, RIGHT: 39, DOWN: 40, ESC: 27, BACK: 8, DELETE: 46
  };

  // TPLS
  var TPLS = {
    inputDelegateContainerTpl: '<div class="input-delegate-ct"></div>',
    containerTpl             : '<div class="btn-group bootstrap-autocomplete form-control"></div>',
    inputTpl                 : '<div class="delegate-input">\
        <input type="text" class="input-delegate">\
        <span class="input-delegate-sizer">W</span>\
      </div>',
    dropdownTpl              : '<ul class="dropdown-menu bs-autocomplete-menu"></ul>',
    placeholderTpl           : '<div class="bs-autocomplete-placeholder"></div>',
    clearBtnTpl              : '<span class="bsautocomplete-icon-cross bsautocomplete-font icon-jiaochacross78"></span>',
    dropdownItemTpl          : '<li>\
        <a href="javascript:">\
          <span class="text"></span>\
        </a>\
      </li>',
    badgeTpl                 : '<span class="label label-primary">\
        <a href="javascript:" class="badge-text"></a>\
        <a href="javascript:" class="badge-close">x</a>\
      </span>'
  };

  // CLS
  var CLS = {
    badgeCt      : 'bs-autocomplete-badge',
    dropdownItem : 'bs-autocomplete-item',
    multiSelected: 'multiple-selected',
    multiHideSel : 'multiple-hide-selected',
  };

  // escapeRegex
  var escapeRegex = function (str) {
    if (typeof str !== 'string') return str;
    var matchOperatorsRe = /[|\\{}()[\]^$+*?.]/g;
    return str.replace(matchOperatorsRe, '\\$&');
  };

  // getInnerSize
  var getInnerWidth = function (el) {
    var padL = getCssNum(el, 'padding-left'), padR = getCssNum(el, 'padding-right');
    return el.innerWidth() - padL - padR;
  };

  // getOuterWidth
  var getOuterWidth = function (el) {
    return el.outerWidth() + getCssNum(el, 'margin-left') + getCssNum(el, 'margin-right');
  };

  // getCaretPosition
  var getCaretPosition = function (oField) {
    var caretPos = 0;
    if (document.selection) {// IE
      var oSel = document.selection.createRange();
      oSel.moveStart("character", 0 - oField.value.length);
      caretPos = oSel.text.length;
    } else if (oField.selectionStart || oField.selectionStart == "0") { // Firefox
      caretPos = oField.selectionStart;
    }
    return caretPos;
  };

  // getCssNum
  var getCssNum = function (el, css) {
    return Number(el.css(css).replace('px', ''));
  };

  // getOuterHtml
  var ohtml = function (e) {
    return $('<div></div>').append(e).html();
  };

  // setCaretPosition
  var setCaretPosition = function (oField) {
    if (document.selection) {// IE
      var oSel = document.selection.createRange();
      oSel.moveStart("character", oField.value.length);
    } else { // Firefox
      oField.selectionStart = oField.value.length;
    }
  };

  // stopEvent
  var stopEvent = function (e) {
    e.preventDefault();
    e.stopPropagation();
  };

  // isString
  var isString = function (val) {
    return typeof val === typeof '';
  };

  // PlaceHolder
  var PlaceHolder = function (ac) {
    var placeholder = this, placeholderEl = placeholder.el = $(ac.params.tpls.placeholderTpl).prependTo(ac.el);
    placeholderEl.text(ac.params.placeHolder);

    placeholder.refresh = function () {
      if (ac.selectedItems.length > 0) placeholderEl.hide();
      else placeholderEl.show();
    };
  };

  // Badge
  var Badge = function (ac) {
    var badge = this;

    // resize
    badge.resize = function (el) {
      if (el) {
        var closeEl = el.find('.badge-close');
        var badgeMarginL = getCssNum(el, 'margin-left'), badgeMarginR = getCssNum(el, 'margin-right');
        var maxWidth = getInnerWidth(ac.el) - ac.input.emptyWidth - badgeMarginL - badgeMarginR - closeEl.outerWidth() - 2;
        el.find('.badge-text').css('max-width', maxWidth + 'px');
      } else {
        ac.el.children('.' + CLS.badgeCt).each(function () {
          badge.resize($(this));
        });
      }
    };

    // closeBadge
    badge.closeBadge = function (badgeEl) {
      badgeEl.find('.badge-close').click();
    };

    // getLastBadge
    badge.getLastBadge = function () {
      var badges = ac.el.children('.' + CLS.badgeCt);
      if (badges.size() > 0) return $(badges[badges.size() - 1]);
    };

    // getCloestBadge
    badge.getCloestBadge = function (mouseX, mouseY) {
      var cloestBadgeEl, isLineMatched;
      ac.el.children('.' + CLS.badgeCt).each(function () {
        var badgeEl = $(this), pos = badgeEl.position();
        var left = pos.left, top = pos.top, bottom = top + badgeEl.outerHeight(),
          right = pos.left + badgeEl.outerWidth();
        if (mouseY >= top && mouseY <= bottom) {
          isLineMatched = true;
          if (mouseX <= left) {
            cloestBadgeEl = badgeEl;
            return false;
          }
        } else if (isLineMatched) {// matched last line last badge
          cloestBadgeEl = badgeEl;
          return false;
        }
      });
      return cloestBadgeEl;
    };

    // add
    badge.add = function (val, speicalData) {
      var item = ac.panel.getSelectedItem();
      if (!item) {
        if (!val) {
          delete ac.editingItem;
          return;
        }

        if (ac.editingItem) {
          if (val === ac.editingItem.item) item = val;
          else if (isString(val)) {
            if (ac.editingItem.text == val) item = ac.editingItem.item;
          } else {
            var ei = ac.editingItem.item, eiCode = ei.c || ei.code, eiName = ei.n || ei.name;
            var valCode = ei.c || ei.code, valName = ei.n || ei.name;
            if (valCode == eiCode && valName == eiName) item = val;
          }
        }

        if (!item) {
          var findItem;
          if (isString(val)) {
            findItem = ac.searchInData(val, speicalData);
            if (!findItem && !ac.params.forceSelect) item = {c: val, n: val};
          } else {
            if (ac.params.forceSelect) {
              findItem = ac.searchInData(val, speicalData);
              if (findItem) item = findItem;
            } else item = val;
          }
        }

        if (!item) {
          delete ac.editingItem;
          return;
        }
      }
      delete ac.editingItem;

      var badgeEl, itemName = item.n || item.name, customNameHtml = item.hn || item.htmlName;
      if (ac.params.badgeRender) badgeEl = ac.params.badgeRender.call(ac, item);
      else {
        badgeEl = $(ac.params.tpls.badgeTpl);
        var text = badgeEl.find('.badge-text');
        if (ac.params.itemUseHtml) text.append(ohtml($(customNameHtml || itemName)));
        else text.text(itemName);
        text.attr('title', itemName);
      }

      badgeEl.addClass(CLS.badgeCt + ' ' + ac.params.badgeCls).click(function (e) {
        stopEvent(e);
      });

      // close handler
      badgeEl.find('.badge-close').click(function (e) {
        if (ac.isReadonly()) return;
        badgeEl.remove();
        ac.removeSelected(item);

        if (ac.selectedItems.length <= 0) ac.input.blur();
        ac.close();
        ac.placeholder.refresh();
        ac.fireBadgeRemoved();
        stopEvent(e);
      });

      // text handler
      badgeEl.find('.badge-text')[ac.params.dblclick4Edit ? 'dblclick' : 'click'](function (e) {
        if (ac.isReadonly()) return;

        badgeEl.after(ac.input.el).remove();
        ac.removeSelected(item);

        var text = ac.isInSearchMode('name') ? item.n || item.name : item.c || item.code;
        if (ac.params.getText4BadgeEdit) text = ac.params.getText4BadgeEdit.call(ac, item, text);
        ac.editingItem = {item: item, text: text};
        ac.close();
        ac.input.updateTextValue(text);
        stopEvent(e);
      });

      var doAdd = false;
      if (ac.params.filtSame && ac.selectedItems.length > 0 && !ac.isSingleMode()) {
        var hasSame = ac.findSelectedItem(item) >= 0;
        if (hasSame) return true;
        else doAdd = true;
      } else doAdd = true;

      if (doAdd) {
        if (ac.isSingleMode()) ac.el.children('.' + CLS.badgeCt).remove();
        ac.input.el.before(badgeEl);
        ac.addSelected(item, !speicalData);
        badge.resize(badgeEl);
        if (ac.isSingleMode()) ac.input.updateTextValue(itemName, false);
        ac.placeholder.refresh();
      }
      return doAdd;
    };

    if (ac.isSingleMode()) ac.el.addClass('single-badge');
  };

  // Input
  var Input = function (ac) {
    var input = this, inputCt = input.el = $(ac.params.tpls.inputTpl).appendTo(ac.el);
    var inputSizer = inputCt.children('.input-delegate-sizer');

    var loadTimeout, compositionFlag;
    var inputEl = inputCt.children(':text');

    var loadDataOnInput = ac.params.debounceFn(ac.params.inputSearchDelay, function () {
      if (ac.destoried) return;

      if (inputEl.val().length < ac.params.minChar) {
        ac.close();
        ac.panel.el.empty();
        return;
      }

      ac.loadData({from: 'keydown'}).then(function () {
        ac.open();
        ac.panel.render();
      });
    }, true);

    inputEl.on({
      'focus'           : function (e) {
        if (ac.isReadonly()) {
          inputEl.blur();
          stopEvent(e);
          return;
        }

        input.isFocused = true;
        input.updateSizer();
        ac.placeholder.el.hide();
        ac.el.addClass('focus');
        if (ac.params.minChar <= 0 || inputEl.val().length >= ac.params.minChar) ac.openOnFocus();
        if (ac.isSingleMode() && ac.getValue().length > 0) {
          setCaretPosition(inputEl[0]);
          ac.editingItem = {item: ac.getValue()[0], text: inputEl.val()};
        }
        ac.fireOnFocus();
      },
      'blur'            : function () {
        if (!input.isFocused) return;
        input.isFocused = false;
        ac.el.removeClass('focus');

        if (inputEl.val() && !input.beforeMoveVal || !inputEl.val() && ac.isSingleMode())
          input.confirmValue(false, true);
        ac.placeholder.refresh();
        ac.close();
        ac.fireOnBlur();
      },
      'keydown'         : function (e) {
        if (ac.isReadonly()) return;

        input.updateSizer();

        var specialKey = false;
        switch (e.keyCode) {
          case KEY_CODES.ENTER:
            var item = ac.panel.getSelectedItem();
            if (item) {
              var itemName = item.n || item.name, itemCode = item.c || item.code;
              if (ac.isInSearchMode('name') && itemName) inputEl.val(itemName);
              else if (itemCode) inputEl.val(itemCode);
            }
            input.blur();
            stopEvent(e);
            specialKey = true;
            break;
          case KEY_CODES.ESC:
            input.confirmValue(true);
            specialKey = true;
            break;
          case KEY_CODES.TAB:
            var hasVal = !!inputEl.val();
            input.confirmValue();
            if (hasVal && !ac.isSingleMode()) {
              inputEl.focus();
              stopEvent(e);
            }
            specialKey = true;
            break;
          case KEY_CODES.LEFT:
          case KEY_CODES.RIGHT:
            var caretPos = getCaretPosition(inputEl[0]), textLen = inputEl.val().length;
            if (e.keyCode == KEY_CODES.LEFT && caretPos == 0) {
              input.moveToLR(true);
              stopEvent(e);
            } else if (e.keyCode == KEY_CODES.RIGHT && caretPos == textLen) {
              input.moveToLR(false);
              stopEvent(e);
            }
            specialKey = true;
            break;
          case KEY_CODES.UP:
          case KEY_CODES.DOWN:
            ac.panel.moveSelect(e.keyCode == KEY_CODES.UP);
            stopEvent(e);
            specialKey = true;
            break;
          case KEY_CODES.BACK:
            if (!inputEl.val()) {
              var prevBadge = inputCt.prev('.' + CLS.badgeCt);
              if (prevBadge.size() > 0) {
                ac.badge.closeBadge(prevBadge);
                stopEvent(e);
                specialKey = true;
              }
            }
            break;
          case KEY_CODES.DELETE:
            if (!inputEl.val()) {
              var nextBadge = inputCt.next('.' + CLS.badgeCt);
              if (nextBadge.size() > 0) {
                ac.badge.closeBadge(nextBadge);
                stopEvent(e);
                specialKey = true;
              }
            }
            break;
          default:
            ac.panel.relocate();
        }

        if (!specialKey) {
          if (loadTimeout) clearTimeout(loadTimeout);
          loadTimeout = setTimeout(function () { // 由于是监听keydown事件，而最后实际输入的字符要keyup之后才能拿到，所以设置个延迟
            loadTimeout = undefined;
            if (!compositionFlag) loadDataOnInput();
          }, 200);
        }
      },
      'keyup'           : function (e) {
        if (ac.isReadonly()) return;
        input.updateSizer();
      },
      'compositionstart': function () {
        compositionFlag = true;
        // console.log('输入法，录入开始');
      },
      'compositionend'  : function () {
        compositionFlag = false;
        loadDataOnInput(); //在input之后执行 所以需要手动调用一次
        // console.log('输入法，输入结束');
      },
    });

    // moveToLR
    input.moveToLR = function (isLeft) {
      if (ac.isSingleMode()) return;

      var badge = isLeft ? inputCt.prev('.' + CLS.badgeCt + ' ') : inputCt.next('.' + CLS.badgeCt);
      if (badge) {
        input.beforeMoveVal = inputEl.val();
        isLeft ? badge.before(inputCt) : badge.after(inputCt);
        inputEl.val(input.beforeMoveVal);
        input.focus();
        delete input.beforeMoveVal;
      }
    };

    // moveToBadge
    input.moveToBadge = function (badge) {
      if (ac.isSingleMode()) return;

      if (badge) badge.before(input.el);
      else {
        var lastBadge = ac.badge.getLastBadge();
        if (lastBadge) lastBadge.after(input.el);
      }
    };

    // updateSizer
    input.updateSizer = function () {
      inputSizer.text(inputEl.val() + 'WW');
    };

    // updateTextValue
    input.updateTextValue = function (text, focus) {
      inputEl.val(text);
      if (!input.isFocused && focus !== false) input.focus();
      input.updateSizer();
      if (isIE && focus !== false) setCaretPosition(inputEl[0]);
    };

    // confirmValue
    input.confirmValue = function (isEsc, fromBlur) {
      var added;

      if (isEsc) {
        if (ac.editingItem) added = ac.badge.add(ac.editingItem.item);
      } else added = ac.badge.add(inputEl.val());

      //if (isIE && ac.isSingleMode() && fromBlur) {
      //  ac.close();
      //  return;
      //}

      if (ac.isSingleMode()) {
        if (!added) {
          if (ac.selectedItems.length > 0) ac.removeSelected(ac.selectedItems[0]);
          if (inputEl.val()) input.clear();
        }
        if (!fromBlur) inputEl.blur();
        ac.close();
      } else if (inputEl.val()) input.clear();
    };

    // blur
    input.blur = function () {
      if (!input.isFocused) return;
      inputEl.blur();
    };

    // clear
    input.clear = function (fireBlur) {
      inputEl.val('');
      if (fireBlur === false) ac.placeholder.refresh();
      else inputEl.blur();
      inputSizer.text('W');
    };

    // getSearchText
    input.getSearchText = function () {
      return inputEl.val();
    };

    // focus
    input.focus = function () {
      if (input.isFocused) return;
      inputEl.focus();
    };

    inputSizer.text('WW');
    input.emptyWidth = getOuterWidth(inputCt);
    inputSizer.text('W');
  };

  // DropdownPanel
  var DropdownPanel = function (ac) {
    var panel = this, panelEl = panel.el = $(ac.params.tpls.dropdownTpl).appendTo(ac.el);

    // moveSelect
    panel.moveSelect = function (isUp) {
      var selItem = panelEl.children('li.selected'), moveToItem, itemCls = '.' + CLS.dropdownItem;
      var skipMultiSel = !ac.isSingleMode() && ac.params.hideOtherSelected4Multiple;
      if (skipMultiSel) itemCls += ':not(.' + CLS.multiHideSel + ')';
      if (selItem.size() > 0) {
        moveToItem = isUp ? selItem.prev() : selItem.next();

        while (moveToItem.size() > 0) {
          if (moveToItem.hasClass(CLS.dropdownItem) && (!skipMultiSel || !moveToItem.hasClass(CLS.multiHideSel)))
            break;
          moveToItem = isUp ? moveToItem.prev() : moveToItem.next();
        }

        if (moveToItem.size() <= 0) {
          var items = panelEl.children(itemCls);
          if (items.size() > 0) moveToItem = isUp ? $(items[items.size() - 1]) : $(items[0]);
        }
      } else {
        var items = panelEl.children(itemCls);
        if (items.size() > 0) moveToItem = isUp ? $(items[items.size() - 1]) : $(items[0]);
      }

      if (moveToItem && moveToItem.length > 0) {
        selItem.removeClass('selected');
        moveToItem.addClass('selected');
        panel.scrollToSelected(moveToItem);
      }
    };

    // scrollToSelected
    panel.scrollToSelected = function (selectedItem) {
      selectedItem = selectedItem || panelEl.children('li.selected');
      if (selectedItem.size() > 0) {
        var scrollTop = panelEl.scrollTop(), top = selectedItem.position().top + scrollTop;
        top = top - (panelEl.height() - selectedItem.height()) / 2;
        panelEl.scrollTop(top);
      }
    };

    // getSelectedItem
    panel.getSelectedItem = function () {
      return panelEl.children('li.selected').data('bsAutoCompleteItem');
    };

    // render
    panel.render = function () {
      var data = ac.data || [], searchText = ac.input.getSearchText();
      panelEl.empty();
      panelEl.scrollTop();

      var ei = ac.editingItem && ac.editingItem.item || {}, eiCode = ei.c || ei.code, eiName = ei.n || ei.name;
      if (data.length > 0) {
        var matched = false, hasOptGroup;
        var isMultiMode = !ac.isSingleMode(), hideOtherSelected4Multiple = ac.params.hideOtherSelected4Multiple;
        var lastGroupEl, lastGroupChildCount = 0, selectableItemCount = 0;

        $.each(data, function (i, item) {
          var itemEl, itemName = item.n || item.name, itemCode = item.c || item.code,
            customNameHtml = item.hn || item.htmlName, selectable = true;
          if (ac.params.itemRender) itemEl = ac.params.itemRender.call(ac, item, searchText);
          else {
            itemEl = $(ac.params.tpls.dropdownItemTpl);
            var text = itemEl.find('.text');
            if (ac.params.itemUseHtml) text.append(ohtml($(customNameHtml || itemName)));
            else text.text(itemName);
          }

          if (isMultiMode) {
            var selectedItem = ac.selectedItemMap[itemCode];
            if (selectedItem &&
              (
                selectedItem === item ||
                (selectedItem.c || selectedItem.code) === itemCode &&
                (selectedItem.n || selectedItem.name) === itemName
              )
            ) {
              itemEl.addClass(CLS.multiSelected);
              if (hideOtherSelected4Multiple) {
                selectable = false;
                itemEl.addClass(CLS.multiHideSel);
              }
            }
          }

          if (item.optGroup === true) {
            selectable = false;
            itemEl.addClass('bs-autocomplete-group');
            if (!hasOptGroup) {
              hasOptGroup = true;
              panelEl.addClass('bs-autocomplete-grouped');
            }

            if (lastGroupEl && lastGroupChildCount <= 0)
              lastGroupEl.addClass('bs-autocomplete-group-hide');

            lastGroupEl = itemEl;
            lastGroupChildCount = 0;
          } else {
            if (lastGroupEl && selectable) lastGroupChildCount++;
            if (selectable) selectableItemCount++;
            itemEl.addClass(CLS.dropdownItem);
          }
          if (item.cls) itemEl.addClass(item.cls);

          itemEl.data('bsAutoCompleteItem', item).appendTo(panelEl)
            .attr('title', itemName)
            .mousedown(function (e) {
              if (ac.isReadonly()) return;
              if (item.optGroup) {
                stopEvent(e);
                return;
              }

              if (isIE) ac.input.blur();
              ac.input.clear();
              ac.badge.add(item);
              stopEvent(e);
            });

          if (!matched && searchText) {
            if (ac.editingItem && ac.editingItem.text == searchText) {
              if (eiCode == itemCode && eiName == itemName)
                matched = true;
            }
            if (ac.isInSearchMode('name') && searchText == itemName) {
              matched = true;
            } else if (ac.isInSearchMode('code') && searchText == itemCode) {
              matched = true;
            }
            if (matched) itemEl.addClass('selected');
          }
        });

        if (lastGroupEl && lastGroupChildCount <= 0)
          lastGroupEl.addClass('bs-autocomplete-group-hide');

        if (selectableItemCount <= 0) {
          panelEl.addClass('no-selectable-items');
        } else {
          panelEl.removeClass('no-selectable-items');
        }

      } else ac.close();
    };

    // resize
    panel.resize = function () {
      panelEl.css('max-width', ac.el.width());
      ac.fireOnPanelResize(ac);
    };

    // relocate
    panel.relocate = function () {
      var inputPosLeft = ac.input.el.position().left;
      if (ac.isSingleMode()) inputPosLeft = 0;
      panelEl.css('left', inputPosLeft + 'px');
    };

    // close
    panel.close = function () {
      panelEl.children().removeClass('selected');
    };

    // destroy
    panel.destroy = function () {
      panelEl.children().each(function () {
        $(this).removeData('bsAutoCompleteItem');
      });
      panelEl.remove();
    };
  };

  // AutoComplete
  var AutoComplete = function (params, originEl) {
    var ac = this;
    params = $.extend(true, {tpls: TPLS}, params || {});
    for (var def in DEF_OPTS) if (typeof params[def] === 'undefined') params[def] = DEF_OPTS[def];
    ac.params = params, ac.initialized = false, ac.selectedItems = [], ac.selectedItemMap = {}, ac.readonly = false;

    // htmlOverHandler
    var htmlOverHandler = function () {
      if (!ac.resized4htmlOver) {
        if (ac.el.is(':visible')) ac.resize();
        $('html').off('mouseover', htmlOverHandler);
        ac.resized4htmlOver = true;
      }
    };

    // htmlClickHandler
    var htmlClickHandler = function (e) {
      if (!ac.el.hasClass('open')) return;
      if ($(e.target).hasClass('bootstrap-autocomplete')) return;

      var autocomplete = $(e.target).parents('.bootstrap-autocomplete');
      if (autocomplete.size() == 0) ac.close();
      else if (autocomplete[0] != ac.el[0]) ac.close();
    };

    // htmlResizeHandler
    var resizeTimeout;
    var htmlResizeHandler = function (e) {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      setTimeout(function () {
        ac.panel.resize();
      }, 100);
    };

    // elOverHandler
    var elOverHandler = function () {
      if (!ac.resized4elOver) {
        if (ac.el.is(':visible')) ac.resize();
        ac.el.off('mouseover', elOverHandler);
        ac.resized4elOver = true;
      }
    };

    // addValue
    ac.addValue = function (items, opts) {
      opts = $.extend({onSetFinish: $.noop}, opts || {});

      var oldSelectedItems = ac.getValue(), changeFired;
      if (opts.clear) ac.clearValue(false);
      if (!items) {
        opts.fireInit ? ac.fireOnInit() : changeFired = ac.fireOnChange(oldSelectedItems, ac.getValue());
        opts.onSetFinish.call(ac, changeFired);
        return;
      }

      if (!(items instanceof Array)) {
        if (isString(items)) items = [{c: items, n: items}];
        else items = [items];
      } else if (items.length <= 0) {
        return;
      } else {
        var formatedItems = [];
        $.each(items, function (i, item) {
          if (isString(item)) formatedItems.push({c: item, n: item});
          else formatedItems.push(item);
        });
        items = formatedItems;
      }

      if (ac.params.forceSelect && ac.params.loadDataItems) {
        ac.loadDataItems(items).then(function (tmpData) {
          $.each(items, function (i, item) {
            ac.badge.add(item, tmpData);
          });
        }).always(function () {
          opts.fireInit ? ac.fireOnInit() : changeFired = ac.fireOnChange(oldSelectedItems, ac.getValue());
          opts.onSetFinish.call(ac, changeFired);
        });
      } else {
        var lastSearchData = ac.data, needCheckRemote = ac.params.forceSelect && ac.params.loadData && true;
        var toCheckCount = items.length, checkedItemCount = 0;
        if (items.length > 0 && !needCheckRemote) ac.data = (ac.params.data || []).slice();
        $.each(items, function (i, item) {
          if (needCheckRemote) {
            if (ac.searchInData(item, lastSearchData)) {
              ac.badge.add(item);
              checkedItemCount++;
            } else {
              var itemCode = item.c || item.code, itemName = item.n || item.name;
              var searchMode = ac.isInSearchMode('name') ? 'name' : 'code';
              var searchText = searchMode == 'code' ? itemCode : itemName, tmpData = [];
              ac.loadData({
                searchText                : searchText,
                specialData               : tmpData,
                showAllItemsWhenFirstFocus: false,
                searchMode                : searchMode,
                from                      : 'addValue'
              }).then(function (tmpData) {
                lastSearchData = tmpData;
                ac.badge.add(item, tmpData);
              }).always(function () {
                if (++checkedItemCount == toCheckCount) {
                  opts.fireInit ? ac.fireOnInit() : changeFired = ac.fireOnChange(oldSelectedItems, ac.getValue());
                  opts.onSetFinish.call(ac, changeFired);
                }
              });
            }
          } else ac.badge.add(item);
        });
        if (!needCheckRemote) {
          opts.fireInit ? ac.fireOnInit() : changeFired = ac.fireOnChange(oldSelectedItems, ac.getValue());
          opts.onSetFinish.call(ac, changeFired);
        }
      }
    };

    // setValue
    ac.setValue = function (items, opts) {
      opts = $.extend(opts || {}, {clear: true});
      ac.addValue(items, opts);
    };

    // openOnFocus
    ac.openOnFocus = function () {
      var showAllItemsWhenFirstFocus = ac.params.showAllWhenSingleForceSelectFocus && ac.params.forceSelect && ac.isSingleMode();
      ac.loadData({showAllItemsWhenFirstFocus: showAllItemsWhenFirstFocus, from: 'openOnFocus'}).then(function () {
        ac.open();
        ac.panel.render();
      });
    };

    // isInSearchMode
    ac.isInSearchMode = function (mode) {
      return ac.params.searchMode.indexOf(mode) >= 0;
    };

    // resize
    ac.resize = function () {
      ac.badge.resize();
    };

    // destroy
    ac.destroy = function () {
      ac.destoried = true;
      ac.panel.destroy();
      $('html').off({'click': htmlClickHandler, 'mouseover': htmlOverHandler});
      $(window).off('resize', htmlResizeHandler);
      ac.params.el.removeData("bsAutoComplete");
      ac.el.remove();
    };

    // fireOnChange
    ac.fireOnChange = function (oldItems, newItems) {
      var fire = true;
      if (oldItems != newItems && oldItems.length == newItems.length) {
        var allItemsSame = true;
        $.each(oldItems, function (i, oldItem) {
          var oldItemCode = oldItem.code || oldItem.c, oldItemName = oldItem.name || oldItem.n;
          var newItem = newItems[i], newItemCode = newItem.code || newItem.c, newItemName = newItem.name || newItem.n;
          if (oldItemCode != newItemCode || oldItemName != newItemName) {
            allItemsSame = false;
            return false;
          }
        });
        if (allItemsSame) fire = false;
      }
      if (fire) {
        if (ac.params.disableResizeContainer !== false && ac.resizeContainer)
          setTimeout(function () { ac.containerEl.height(ac.el.outerHeight()); }, 0);
        ac.params.el.trigger('bs.autocomplete.change', [oldItems, newItems]);
      }
      return fire;
    };

    // fireOnPanelResize
    ac.fireOnPanelResize = function () {
      ac.params.el.trigger('bs.autocomplete.panel.resize', [ac]);
    };

    // fireOnSelect
    ac.fireOnSelect = function (item, items) {
      ac.params.el.trigger('bs.autocomplete.select', [item, items]);
    };

    // fireOnClose
    ac.fireOnClose = function () {
      if (ac.inputGroupEl) ac.inputGroupEl.removeClass('open');
      ac.params.el.trigger('bs.autocomplete.close');
    };

    // fireOnInit
    ac.fireOnInit = function () {
      if (ac.isInitialized) return;

      ac.isInitialized = true;
      ac.params.el.trigger('bs.autocomplete.inited');
    };

    // fireOnFocus
    ac.fireOnFocus = function () {
      if (ac.inputGroupEl) ac.inputGroupEl.addClass('focus');
      ac.params.el.trigger('bs.autocomplete.focus');
    };

    // fireOnPen
    ac.fireOnPen = function () {
      if (ac.inputGroupEl) ac.inputGroupEl.addClass('open');
      ac.params.el.trigger('bs.autocomplete.open');
    };

    // fireBadgeRemoved
    ac.fireBadgeRemoved = function () {
      ac.params.el.trigger('bs.autocomplete.badge.removed');
    };

    // fireOnBlur
    ac.fireOnBlur = function () {
      if (ac.inputGroupEl) ac.inputGroupEl.removeClass('focus');
      ac.params.el.trigger('bs.autocomplete.blur');
    };

    // fireOnDeSelect
    ac.fireOnDeSelect = function (item, items) {
      ac.params.el.trigger('bs.autocomplete.deselect', [item, items]);
    };

    // is
    ac.isSingleMode = function () {
      return !ac.params.multiple;
    };

    // close
    ac.close = function () {
      ac.el.removeClass('open');
      ac.panel.close();
      ac.fireOnClose();
    };

    // open
    ac.open = function () {
      if (ac.readonly) return;
      ac.panel.resize();
      ac.panel.relocate();
      ac.el.addClass('open');
      ac.fireOnPen();
    };

    // getValue
    ac.getValue = function () {
      return ac.selectedItems.slice();
    };

    // clearData
    ac.clearData = function () {
      ac.data.splice(0, ac.data.length);
    };

    // clearValue
    ac.clearValue = function (fire) {
      if (ac.isSingleMode()) ac.input.clear(fire);

      var oldSelectedItems = ac.getValue();
      ac.selectedItems.splice(0, ac.selectedItems.length);
      ac.selectedItemMap = {};
      ac.el.children('.' + CLS.badgeCt).remove();
      ac.el.removeClass('selected');
      ac.placeholder.refresh();
      if (fire !== false) {
        ac.params.el.trigger('bs.autocomplete.clear');
        ac.fireOnChange(oldSelectedItems, ac.getValue());
      }
    };

    // setReadonly
    ac.setReadonly = function (readonly) {
      readonly = readonly !== false;
      ac.readonly = readonly;
      if (readonly) ac.el.addClass('readonly');
      else ac.el.removeClass('readonly');
    };

    // isReadonly
    ac.isReadonly = function () {
      return ac.readonly;
    };

    // addSelected
    ac.addSelected = function (item, fire) {
      var oldSelectedItems = ac.selectedItems.slice();

      if (ac.isSingleMode()) {
        ac.selectedItems.splice(0, ac.selectedItems.length);
        ac.selectedItemMap = {};
      }

      ac.selectedItems.push(item);
      ac.selectedItemMap[item.c || item.code] = item;
      if (ac.selectedItems.length > 0) ac.el.addClass('selected');

      if (fire !== false) {
        ac.fireOnSelect(item, ac.getValue());
        ac.fireOnChange(oldSelectedItems, ac.getValue());
      }
    };

    // removeSelected
    ac.removeSelected = function (item) {
      var findIndex = ac.findSelectedItem(item);
      if (findIndex >= 0) {
        var oldSelectedItems = ac.selectedItems.slice();
        ac.selectedItems.splice(findIndex, 1);
        delete ac.selectedItemMap[item.c || item.code];
        if (ac.selectedItems.length <= 0) ac.el.removeClass('selected');

        ac.fireOnDeSelect(item, ac.getValue());
        ac.fireOnChange(oldSelectedItems, ac.getValue());
      }
    };

    // isItemMatched
    ac.isItemMatched = function (searchText, item) {
      var regex = new RegExp(escapeRegex(searchText), ac.params.ignoreCase ? 'i' : undefined);
      var matched = false;
      if (ac.isInSearchMode('name')) matched = regex.test(item.n || item.name);
      if (!matched && ac.isInSearchMode('code')) matched = regex.test(item.c || item.code);
      return matched;
    };

    // findSelectedItem
    ac.findSelectedItem = function (item) {
      var result = -1, itemCode = item.c || item.code, itemName = item.n || item.name;
      $.each(ac.selectedItems, function (i, selItem) {
        var selCode = selItem.c || selItem.code, selName = selItem.n || selItem.name;
        if (selCode == itemCode && selName == itemName) {
          result = i;
          return false;
        }
      });
      return result;
    };

    // searchInData
    ac.searchInData = function (item, data) {
      var isFromStr = isString(item);
      if (isFromStr) item = {c: item, n: item};
      var findItem, itemCode = item.c || item.code, itemName = item.n || item.name, data = data || ac.data;

      $.each(data, function (i, dataItem) {
        var dataCode = dataItem.c || dataItem.code, dataName = dataItem.n || dataItem.name;
        if (isFromStr) {
          if (ac.isInSearchMode('name') && dataName == itemName || ac.isInSearchMode('code') && dataCode == itemCode) {
            findItem = dataItem;
            return false;
          }
        } else {
          if (dataName == itemName && dataCode == itemCode) {
            findItem = dataItem;
            return false;
          }
        }
      });
      return findItem;
    };

    // loadDataItems
    ac.loadDataItems = function (items) {
      var defered = $.Deferred();
      var loadedItems = [];

      ac.params.loadDataItems.call(ac, items, function (data) {
        if (data) {
          $.each(data, function (i, item) {
            if (isString(item)) item = {c: item, n: item};
            loadedItems.push(item);
          });
          defered.resolve(loadedItems);
        } else defered.reject();
      });

      return defered.promise();
    };

    // loadData
    ac.loadData = function (opts) {
      opts = opts || {};
      opts.searchText = opts.showAllItemsWhenFirstFocus ? '' : (opts.searchText || ac.input.getSearchText());
      var defered = $.Deferred();

      opts.specialData = opts.specialData || ac.data;
      opts.specialData.splice(0, opts.specialData.length);
      if (ac.params.loadData) {
        ac.params.loadData.call(ac, opts.searchText, function (data) {
          if (data) {
            opts.specialData.splice(0, opts.specialData.length);
            $.each(data, function (i, item) {
              if (isString(item)) item = {c: item, n: item};
              opts.specialData.push(item);
            });
            defered.resolve(opts.specialData);
          } else defered.reject();
        }, opts.searchMode, opts.from);
      } else {
        var data = ac.params.data || [], lastGroupItem;
        $.each(data, function (i, item) {
          if (isString(item)) item = {c: item, n: item};
          if (item.optGroup === true) {
            lastGroupItem = item;
            return;
          }
          if (opts.searchText && !ac.isItemMatched(opts.searchText, item)) return;
          if (lastGroupItem) {
            opts.specialData.push(lastGroupItem);
            lastGroupItem = undefined;
          }
          opts.specialData.push(item);
        });
        defered.resolve(opts.specialData);
      }
      return defered.promise();
    };

    ac.data = [], ac.el = $(ac.params.tpls.containerTpl).addClass(ac.params.cls);

    // 解决在 input-group 中的样式问题
    var inputGroupEl = ac.inputGroupEl = params.el.closest('.input-group'),
      isUnderInputGroup = ac.isUnderInputGroup = inputGroupEl.size() > 0;

    var isOriginInputEl = params.el.is(':input');
    if (isOriginInputEl && !ac.params.replace) ac.params.replace = true;

    // 原始元素为 input 时且父元素为 input-group 时放入代理容器
    var inputDelegateCtEl;
    if (isOriginInputEl && params.el.parent().hasClass('input-group')) {
      inputDelegateCtEl = ac.inputDelegateCtEl = $(ac.params.tpls.inputDelegateContainerTpl)
        .addClass('form-control');
      inputDelegateCtEl.insertAfter(params.el);
      params.el.appendTo(inputDelegateCtEl);
    }

    if (ac.params.fitWdith !== false) ac.el.addClass('fit-width');
    if (ac.params.dropUp) ac.el.addClass('dropup');
    if (ac.params.replace) {
      ac.el.insertAfter(params.el);
      params.el.hide();
    } else {
      if (inputDelegateCtEl) {
        ac.el.appendTo(inputDelegateCtEl);
      } else {
        if (isUnderInputGroup) params.el.addClass('form-control');
        ac.el.appendTo(params.el);
      }
    }

    var bsAcCtEl = ac.containerEl = ac.el.parent(), resizeHeightCls = 'bs-ac-ct-resize';
    if (isUnderInputGroup && bsAcCtEl.hasClass('form-control')) bsAcCtEl.addClass(resizeHeightCls);
    ac.resizeContainer = bsAcCtEl.hasClass(resizeHeightCls);

    ac.input = new Input(ac);
    ac.panel = new DropdownPanel(ac);
    ac.badge = new Badge(ac);
    ac.placeholder = new PlaceHolder(ac);
    if (ac.params.data) {
      $.each(ac.params.data, function (i, item) {
        if (isString(item)) ac.data.push({c: item, n: item});
        else ac.data.push(item);
      });
      ac.params.data = ac.data.slice();
    }

    { // clear btn
      $(ac.params.tpls.clearBtnTpl).appendTo(ac.el).click(function (e) {
        if (ac.isReadonly()) return;

        ac.clearValue();
        stopEvent(e);
      });
    }

    if (ac.params.readonly) ac.setReadonly(true);

    ac.el.on({
      mousedown: function (e) {
        if (ac.isReadonly()) return;

        if (e.target == ac.el[0]) {
          var badge = ac.badge.getCloestBadge(e.offsetX, e.offsetY);
          ac.input.moveToBadge(badge);
          if (ac.input.isFocused) stopEvent(e);
          //ac.input.focus();
        }
      },
      click    : function (e) {
        if (ac.isReadonly()) return;
        ac.input.focus();
        if (ac.input.isFocused) stopEvent(e);
      },
      mouseover: elOverHandler
    });

    originEl.data("bsAutoComplete", this);
    if (ac.params.value) ac.setValue(ac.params.value, {fireInit: true});
    else ac.fireOnInit();

    $('html').on({'click': htmlClickHandler, 'mouseover': htmlOverHandler});
    $(window).on('resize', htmlResizeHandler);
  };

  $.fn.bsAutoComplete = function (params) {
    var args = arguments;
    return this.each(function () {
      if (!this) return;
      var $this = $(this);

      var bsAutoComplete = $this.data("bsAutoComplete");
      if (!bsAutoComplete && params != 'destroy') {
        params = $.extend({
          el: $this, value: $this.val() ? $this.val().split(params.splitChar || ' ') : ''
        }, params);
        bsAutoComplete = new AutoComplete(params, $this);
      }
      if (bsAutoComplete && isString(params))
        bsAutoComplete[params].apply(bsAutoComplete, Array.prototype.slice.call(args, 1));
    });
  }

})(jQuery);
