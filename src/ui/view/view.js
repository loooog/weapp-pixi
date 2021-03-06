import SYSTEM from "../../core/system";
import * as PIXI from 'pixi.js';

export default class View extends PIXI.Container {
  static ALIGN_LEFT = 0x00;
  static ALIGN_CENTER = 0x01;
  static ALIGN_RIGHT = 0x02;
  static ALIGN_TOP = 0x04;
  static ALIGN_MIDDLE = 0x08;
  static ALIGN_BOTTOM = 0x10;
  static ALIGN_MAP = {
    'left' : View.ALIGN_LEFT,
    'center': View.ALIGN_CENTER,
    'right': View.ALIGN_RIGHT,
    'top': View.ALIGN_TOP,
    'middle': View.ALIGN_MIDDLE,
    'bottom': View.ALIGN_BOTTOM
  };

  static ATTR_VALUE = 0;
  static ATTR_SIZE = 1; // size: 1 | '1px' | '1dp'
  static ATTR_RECT = 2; // { top: 1 | '1px' | '1dp', left: ..., bottom: ..., right: ... }
  static ATTR_ALIGN = 3; // 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom'
  static ATTR_TEXTSTYLE = 4; // { fontSize: 1 | '1px' | '1dp' }
  static ATTR_TEXTURE = 5; // 'id'

  static LAYOUT_WRAP_CONTENT = 0;
  static LAYOUT_EXACT = 1;

  constructor(attrs, ...args) {
    super();
    
    this.margin = {top: 0, left: 0, bottom: 0, right: 0};
    this.padding = {top: 0, left: 0, bottom: 0, right: 0};

    this.layoutHintWidth = View.LAYOUT_WRAP_CONTENT;
    this.layoutHintHeight = View.LAYOUT_WRAP_CONTENT;
    
    this.layoutWidth = 0;
    this.layoutHeight = 0;

    this.align = View.ALIGN_TOP | View.ALIGN_LEFT;
    this.selector = "";

    this.viewWidth = 0;
    this.viewHeight = 0;
    this.alignOffsetX = 0;
    this.alignOffsetY = 0;

    this.attrs = attrs;
    this._parseAttrs(attrs);
    this._parseArgs(args);
    this._init();
    this._render();
  }

  _parseAttrAlign(align) {
    if(typeof align === 'string') {
      if(align.match(/^(left|center|right|top|middle|bottom)(\|(left|center|right|top|middle|bottom))*$/)) {
        const aligns = align.split('|');
        let al = 0;

        for(const a of aligns) {
          al |= View.ALIGN_MAP[a];
        }

        return al;
      } else {
        throw new Error('`align` should be one of the followings: left|center|right|top|middle|bottom');
      }
    } else if(typeof align === 'number') {
      return parseInt(align);
    }

    throw new Error('invalid `align` values');
  }

  _parseAttrRect(spacing) {
    if(typeof spacing != 'object') {
      return null;
    }

    if(typeof spacing.top != 'undefined') {
      spacing.top = SYSTEM.px(spacing.top);
    }

    if(typeof spacing.left != 'undefined') {
      spacing.left = SYSTEM.px(spacing.left);
    }

    if(typeof spacing.bottom != 'undefined') {
      spacing.bottom = SYSTEM.px(spacing.bottom);
    }

    if(typeof spacing.right != 'undefined') {
      spacing.right = SYSTEM.px(spacing.right);
    }

    return spacing;
  }

  _parseAttrSize(size) {
    return SYSTEM.px(size);
  }

  _parseAttrTextStyle(style) {
    if(typeof style != 'object') {
      return null;
    }

    if(typeof style.fontSize != 'undefined') {
      style.fontSize = SYSTEM.px(style.fontSize);
    }

    return style;
  }

  _parseAttrTexture(id) {
    return SYSTEM.resId(id);
  }

  _setAttrs(target, src, type, selector, ...properties) {
    if(typeof target != 'object' || typeof src != 'object') {
      return;
    }

    for(const p of properties) {
      if(typeof src[p] != 'undefined') {
        if(type === View.ATTR_SIZE) {
          target[p] = this._parseAttrSize(typeof src[p + selector] != 'undefined' ? src[p + selector] : src[p]);
        } else if(type === View.ATTR_ALIGN) {
          target[p] = this._parseAttrAlign(typeof src[p + selector] != 'undefined' ? src[p + selector] : src[p]);
        } else if(type === View.ATTR_RECT) {
          if(typeof target[p] === 'undefined') {
            target[p] = {};
          }

          Object.assign(target[p], this._parseAttrRect(typeof src[p + selector] != 'undefined' ? src[p + selector] : src[p]));
        } else if(type === View.ATTR_TEXTSTYLE) {
          if(typeof target[p] === 'undefined') {
            target[p] = {};
          }
          Object.assign(target[p], this._parseAttrTextStyle(typeof src[p + selector] != 'undefined' ? src[p + selector] : src[p]));
        } else if(typeof type === View.ATTR_TEXTURE) {
          target[p] = this._parseAttrTexture(typeof src[p + selector] != 'undefined' ? src[p + selector] : src[p]); 
        } else if(typeof type === 'function') {
          target[p] = type(typeof src[p + selector] != 'undefined' ? src[p + selector] : src[p]);
        } else {
          target[p] = typeof src[p + selector] != 'undefined' ? src[p + selector] : src[p];
        }
      }
    }
  }

  _parseAttrs(attrs) {
    this._setAttrs(this, attrs, View.ATTR_RECT, this.selector, 'margin', 'padding');
    this._setAttrs(this, attrs, View.ATTR_ALIGN, this.selector, 'align');
    this._setAttrs(this, attrs, View.ATTR_SIZE, this.selector, 'layoutWidth', 'layoutHeight');
    this._setAttrs(this, attrs, View.ATTR_VALUE, '', 'selector');

    if(typeof this.onParseAttrs === 'function') {
      this.onParseAttrs(attrs);
    }
  }

  _updateAttrs() {
    this.parseAttrs(this.attrs);
  }

  _parseArgs(args) {
    if(typeof this.onParseArgs === 'function') {
      this.onParseArgs(args);
    }
  }

  _init() {
    if(this.layoutWidth > 0) {
      this.layoutHintWidth = View.LAYOUT_EXACT;
    }

    if(this.layoutHeight > 0) {
      this.layoutHintHeight = View.LAYOUT_EXACT;
    }

    // events

    this.interactive = true;
    this.tap = (e) => {
      if(typeof this.onClick === 'function') {
        this.onClick(e);
      }
    }

    if(typeof this.onInit === 'function') {
      this.onInit();
    }
  }

  _align() {
    if (this.align & View.ALIGN_LEFT) {
      this.alignOffsetX = 0;
    }

    if (this.align & View.ALIGN_CENTER) {
      this.alignOffsetX = (this.layoutWidth - this.viewWidth) / 2;
    }

    if (this.align & View.ALIGN_RIGHT) {
      this.alignOffsetX = this.layoutWidth - this.viewWidth;
    }

    if (this.algin & View.ALIGN_TOP) {
      this.alignOffsetY = 0;
    }

    if (this.align & View.ALIGN_MIDDLE) {
      this.alignOffsetY = (this.layoutHeight - this.viewHeight) / 2;
    }

    if (this.align & View.ALIGN_BOTTOM) {
      this.alignOffsetY = this.layoutHeight - this.viewHeight;
    }
  }

  _measure() {
    if(typeof this.onMeasure === 'function') {
      [this.viewWidth, this.viewHeight] = this.onMeasure();
    }
    
    if(this.layoutHintWidth === View.LAYOUT_WRAP_CONTENT) {
      this.layoutWidth = this.viewWidth;
    } 

    if(this.layoutHintHeight === View.LAYOUT_WRAP_CONTENT) {
      this.layoutHeight = this.viewHeight;
    }

    this.hitArea = new PIXI.Rectangle(0, 0, this.layoutWidth, this.layoutHeight);
  }

  _renderBackground() {
    // let backgroundStyle = this.style['backgroundStyle' + this.state];
    // if (typeof backgroundStyle == 'undefined') {
    //   delete this.backgroundView;
    //   return;
    // }

    // this.removeChild(this.backgroundView);
    // delete this.backgroundView;
    
    // if (backgroundStyle.backgroundType == 'circle') {
    //   let r = Math.min(this.layoutWidth, this.layoutHeight) / 2;

    //   this.backgroundView = new PIXI.Graphics();
    //   this.backgroundView.lineStyle(backgroundStyle.borderWidth, backgroundStyle.borderColor, backgroundStyle.borderAlpha);
    //   this.backgroundView.beginFill(backgroundStyle.fillColor, backgroundStyle.fillAlpha);
    //   this.backgroundView.drawCircle(r, r, r);
    //   this.backgroundView.endFill();
    //   this.addChildAt(this.backgroundView, 0);
    // } else if(backgroundStyle.backgroundType == 'roundedRect') {
    //   let cornerRadius = backgroundStyle.cornerRadius;
    //   if(cornerRadius > 0 && cornerRadius < 1) {
    //     cornerRadius = cornerRadius * Math.min(this.layoutWidth, this.layoutHeight);
    //   }

    //   this.backgroundView = new PIXI.Graphics();
    //   this.backgroundView.lineStyle(backgroundStyle.borderWidth, backgroundStyle.borderColor, backgroundStyle.borderAlpha);
    //   this.backgroundView.beginFill(backgroundStyle.fillColor, backgroundStyle.fillAlpha);
    //   this.backgroundView.drawRoundedRect(0, 0, this.layoutWidth, this.layoutHeight, cornerRadius);
    //   this.backgroundView.endFill();
    //   this.addChildAt(this.backgroundView, 0);
    // } else if(backgroundStyle.backgroundType == 'rect') {
    //   this.backgroundView = new PIXI.Graphics();
    //   this.backgroundView.lineStyle(backgroundStyle.borderWidth, backgroundStyle.borderColor, backgroundStyle.borderAlpha);
    //   this.backgroundView.beginFill(backgroundStyle.fillColor, backgroundStyle.fillAlpha);
    //   this.backgroundView.drawRect(0, 0, this.layoutWidth, this.layoutHeight);
    //   this.backgroundView.endFill();
    //   this.addChildAt(this.backgroundView, 0);
    // }
  }

  _render() {
    if(typeof this.onRender === 'function') {
      this.onRender();
    }
    
    this._measure();
    this._align();

    if(typeof this.onLayout === 'function') {
      this.onLayout();
    }
    
    this._renderBackground();
  }

  invalidate() {
    this._render();
  }

  update() {
    
  }

  setOnClick(onClick) {
    if(typeof onClick == 'function') {
      this.interactive = true;
      this.onClick = onClick;
      this.tap = (event) => {
        this.onClick(event);
      }
    }
  }

  setSelector(selector) {
    if (this.selector != selector) {
      this.selector = selector;
      
      this._updateAttrs();
      this._render();
    }
  }
}