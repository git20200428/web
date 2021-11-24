/**
 * Created by jliu10 on 5/3/2016.
 */

/**
 * Simple Map
 *
 *
 * let m = new JSMap();
 * m.put('key','value');
 * ...
 * let s = "";
 * m.each(function(key,value,index){
 *      s += index+":"+ key+"="+value+"/n";
 * });
 * alert(s);
 *
 * @author dewitt
 * @date 2008-05-24
 */
function JSMap() {
    /** 存放键的数组(遍历用到) */
    this.keys = [];
    /** 存放数据 */
    this.data = {};

    /**
     * 放入一个键值对
     * @param {String} key
     * @param {Object} value
     */
    this.put = function (key, value) {
        if (this.data[key] == null) {
            this.keys.push(key);
        }
        this.data[key] = value;
    };

    /**
     * 获取某键对应的值
     * @param {String} key
     * @return {Object} value
     */
    this.get = function (key) {
        return this.data[key];
    };

    /**
     * 删除一个键值对
     * @param {String} key
     */
    this.remove = function (key) {
        for (let i = 0; i < this.keys.length; i++) {
            if (key == this.keys[i])
                this.keys.splice(i, 1);
        }
        this.data[key] = null;
    };

    /**
     * 遍历Map,执行处理函数
     *
     * @param {Function} 回调函数 function(key,value,index){..}
     */
    this.each = function (fn) {
        if (typeof fn != 'function') {
            return;
        }
        let len = this.keys.length;
        for (let i = 0; i < len; i++) {
            let k = this.keys[i];
            fn(k, this.data[k], i);
        }
    };

    /**
     * 获取键值数组(类似<a href="http://lib.csdn.net/base/17" class='replace_word' title="Java EE知识库" target='_blank' style='color:#df3434; font-weight:bold;'>Java</a>的entrySet())
     * @return 键值对象{key,value}的数组
     */
    this.entrys = function () {
        let len = this.keys.length;
        let entrys = new Array(len);
        for (let i = 0; i < len; i++) {
            entrys[i] = {
                key: this.keys[i],
                value: this.data[i]
            };
        }
        return entrys;
    };

    /**
     * 判断Map是否为空
     */
    this.isEmpty = function () {
        return this.keys.length == 0;
    };

    /**
     * 获取键值对数量
     */
    this.size = function () {
        return this.keys.length;
    };

    /**
     * 重写toString
     */
    this.toString = function () {
        let s = "{";
        for (let i = 0; i < this.keys.length; i++, s += ',') {
            let k = this.keys[i];
            s += k + "=" + this.data[k];
        }
        s += "}";
        return s;
    };
}

export default JSMap