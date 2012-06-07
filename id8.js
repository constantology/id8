!function(util, Name) {
    "use strict";
    function __lib__(name_or_type) {
        var Class = typeof name_or_type == "function" && util.type(name_or_type) == "class" ? name_or_type : getClass(name_or_type);
        if (!Class) throw new Error(Name + " factory: No Class found with a name or type of " + name_or_type);
        return Class.create.apply(null, Array.coerce(arguments, 1));
    }
    function NS(name) {
        return "^" + Name + "." + name;
    }
    function define(name, descriptor) {
        var Class, Constructor, module = descriptor.module, namespace = name.split("."), path;
        delete descriptor.module;
        name = name.replace(re_valid_name, "");
        descriptor.type || (descriptor.type = name.toLowerCase().split(".").join("-"));
        Class = __lib__.Class(descriptor);
        Constructor = Class.constructor[__singleton__] ? Class.constructor : Class;
        path = util.bless(namespace.slice(0, -1), module);
        util.def(Constructor, __classname__, util.describe(name, "w"), true);
        register(Constructor);
        return path[namespace.pop()] = Class;
    }
    function getClass(name_or_type) {
        return registered_path[name_or_type] || registered_type[name_or_type] || registered_path[Name + "." + name_or_type] || registered_type[lc_Name + "-" + name_or_type];
    }
    function register(Class) {
        var name = Class[__classname__], type = Class.prototype[__type__];
        if (name in registered_path || type in registered_type) throw new Error(Name + ".define: there is already a Class called: " + name);
        return registered_path[name] = registered_type[type] = Class;
    }
    function sequence(property, Class) {
        var res = [], val;
        typeof Class != "object" || (Class = Class.constructor);
        if (typeof Class == "function" && util.type(Class) == "class") {
            do {
                !(val = Object.value(Class, property)) || res.push(val);
            } while (Class = Class[__super__]);
        }
        return res;
    }
    var __classname__ = "__classname__", __name__ = "__name__", __singleton__ = "__singleton__", __super__ = "__super__", __type__ = "__type__", lc_Name = Name.toLowerCase(), re_valid_name = /[^A-Za-z0-9_\.]/g, registered_path = util.obj(), registered_type = util.obj(), sequence_class = sequence.bind(null, __classname__), sequence_type = sequence.bind(null, "prototype." + __type__);
    util.defs(__lib__, {
        __name__ : {
            value : Name
        },
        __type__ : {
            value : "library"
        },
        define : define,
        getClass : getClass
    }, "w", true);
    !function() {
        function Class(setup) {
            var config = make_configuration(setup), Constructor = make_class(config);
            return config.singleton ? make_singleton(Constructor, config) : Constructor;
        }
        function create() {
            return singleton(this) || this.apply(Object.create(this.prototype), arguments);
        }
        function decorate(Constructor) {
            util.def(Constructor, "create", util.describe(create.bind(Constructor), "r"), true);
            util.def(Constructor, __type__, class_type, true);
            return Constructor;
        }
        function extract_prototype_descriptors(config) {
            return Object.keys(config).reduce(function(o, k) {
                if (!util.got(default_prop_names, k)) {
                    o[k] = config[k];
                    delete config[k];
                }
                return o;
            }, util.obj());
        }
        function get_descriptor(o, k) {
            var descriptor = Object.getOwnPropertyDescriptor(o, k) || (typeof o[k] == "function" ? util.describe(o[k], "cw") : default_super_descriptor);
            descriptor.writable = true;
            return descriptor;
        }
        function is(instance, Class) {
            switch (typeof Class) {
              case "function":
                return instance instanceof Class;
              case "string":
                return (Class = getClass(Class)) ? instance instanceof Class : false;
            }
            return false;
        }
        function make_class(config) {
            function Class_constructor() {
                return this instanceof Class_constructor ? singleton(this.constructor) || Constructor.apply(this, arguments) : create.apply(Class_constructor, arguments);
            }
            var constructor = config.constructor, super_descriptor = get_descriptor(config.extend.prototype, "constructor"), Constructor = make_method(constructor, super_descriptor);
            Class_constructor.prototype = make_prototype(config);
            Class_constructor.prototype.constructor = Class_constructor;
            util.def(Class_constructor, __super__, super_descriptor, true);
            if (constructor[__name__] != "anonymous") util.def(Class_constructor, __classname__, util.describe(constructor[__name__], "w"));
            return decorate(Class_constructor.mimic(constructor));
        }
        function make_configuration(setup) {
            var config = Object.keys(setup || util.obj()).reduce(function(o, k) {
                o[k] = setup[k];
                return o;
            }, util.obj());
            if (typeof config.extend == "string") config.extend = registered_path[config.extend] || registered_type[config.extend];
            if (typeof config.extend != "function") config.extend = Object;
            if (typeof config.constructor != "function" || config.constructor === Object) config.constructor = config.extend.valueOf();
            if (typeof config.type != "string" && config.constructor !== Object && config.constructor.__name__ != "anonymous") config.type = String(config.constructor.__name__).toLowerCase();
            return config;
        }
        function make_method(method, super_descriptor, name) {
            super_descriptor = typeof super_descriptor != "object" || method.valueOf() === super_descriptor.value.valueOf() ? default_super_descriptor : super_descriptor || default_super_descriptor;
            return function Class_instance_method() {
                var a = arguments, descriptor = get_descriptor(this, "parent"), return_value, u;
                util.def(this, "parent", super_descriptor || default_super_descriptor, true);
                return_value = method.apply(this, util.tostr(a[0]) === "[object Arguments]" ? a[0] : a);
                util.def(this, "parent", descriptor, true);
                return this.chain !== false && return_value === u ? this : return_value;
            }.mimic(method, name);
        }
        function make_prototype(config) {
            var descriptor = extract_prototype_descriptors(config), super_class = config.extend, processed = util.obj(), prototype = Object.create(super_class.prototype);
            Object.keys(descriptor).forEach(function(k) {
                var description = descriptor[k];
                switch (util.nativeType(description)) {
                  case "object":
                    break;
                  case "function":
                    description = util.describe(make_method(description, get_descriptor(prototype, k), k), "cw");
                    break;
                  default:
                    description = util.describe(description, "ew");
                }
                processed[k] = true;
                util.def(prototype, k, description, true);
            });
            Object.getOwnPropertyNames(prototype).forEach(function(k) {
                if (k in processed || typeof prototype[k] != "function") return;
                util.def(prototype, k, util.describe(make_method(prototype[k], default_super_descriptor), "cw"), true);
            });
            util.def(prototype, __type__, util.describe(config.type, "w"), true);
            util.def(prototype, "parent", default_super_descriptor, true);
            return prototype;
        }
        function make_singleton(Constructor, config) {
            var instance = config.singleton === true ? new Constructor : Constructor.create.apply(null, [].concat(config.singleton));
            util.def(Constructor, __singleton__, util.describe({
                value : instance
            }, "r"));
            return instance;
        }
        function match_type(Class, type) {
            return Class[__classname__] === type || Class.prototype[__type__] === type;
        }
        function singleton(Constructor) {
            return !Constructor ? null : Constructor[__singleton__] || null;
        }
        function to_obj(o, k) {
            o[k] = true;
            return o;
        }
        function type(instance) {
            var constructor = instance.constructor, type = constructor[__classname__] || constructor[__name__];
            return type === "Class_constructor" ? "Anonymous" : type;
        }
        var class_type = util.describe("class", "r"), default_prop_names = "constructor extend mixin singleton type".split(" ").reduce(to_obj, util.obj()), default_super_descriptor = util.describe(util.noop, "cw");
        util.defs(__lib__, {
            Class : Class,
            is : is,
            type : type
        }, "r");
    }();
    util.x.cache("Function", function(Type) {
        util.def(Type.prototype, "callback", util.describe(function(conf) {
            return (new __lib__.Callback(this, conf)).fire.mimic(this);
        }, "w"));
    });
    util.x.cache("Object", function(Type) {
        function rm(k) {
            delete this[k];
        }
        util.defs(Type, {
            key : function(o, v) {
                for (var k in o) if (util.has(o, k) && o[k] === v) return k;
                return null;
            },
            remove : function(o, keys) {
                (Array.isArray(keys) ? keys : Array.coerce(arguments, 1)).forEach(rm, o);
                return o;
            }
        }, "w");
    });
    util.x(Object, Array, Boolean, Function);
    util.def(__lib__, util.__name__, util.describe({
        value : util
    }, "r"));
    util.ENV != "commonjs" ? util.def(util.global, Name, util.describe({
        value : __lib__
    }, "r")) : module.exports = __lib__;
    __lib__.define(NS("Callback"), function() {
        function buffer() {
            if (bid in this) return this;
            this[bid] = setTimeout(buffer_stop.bind(this), this.buffer);
            return this.exec.apply(this, arguments);
        }
        function buffer_stop() {
            clearTimeout(this[bid]);
            delete this[bid];
        }
        function eventType(t) {
            return t.indexOf("event") + 5 === t.length;
        }
        function handleEvent() {
            return this.fire.apply(this, arguments);
        }
        var bid = "bufferId", tid = "timeoutId";
        return {
            constructor : function Callback(fn, conf) {
                util.copy(this, conf || {});
                var desc = util.describe(null, "w"), fire = (util.type(this.buffer) == "number" ? buffer : this.exec).bind(this);
                desc.value = fn;
                util.def(this, "fn", desc);
                desc.value = this;
                util.def(fire, "cb", desc);
                desc.value = fire;
                util.def(this, "fire", desc);
                this.args || (this.args = []);
                this.ctx || (this.ctx = this);
                util.type(this.delay) == "number" || (this.delay = null);
                util.type(this.times) == "number" && this.times > 0 || (this.times = 0);
                this.enable();
            },
            chain : true,
            module : __lib__,
            buffer : null,
            count : 0,
            delay : null,
            times : 0,
            disable : function() {
                this.disabled = true;
                this.handleEvent = util.noop;
            },
            enable : function() {
                this.disabled = false;
                this.handleEvent = handleEvent;
            },
            exec : function() {
                if (this.disabled) return;
                this.times === 0 || this.times > ++this.count || this.disable();
                var a = Array.coerce(arguments), me = this, ctx = me.ctx, ms = me.delay, t = util.type(a[0]), v;
                t && (eventType(t) || t == Name + "-observer") ? a.splice.apply(a, [ 1, 0 ].concat(me.args)) : a.unshift.apply(a, me.args);
                ms === null ? v = me.fn.apply(ctx, a) : me[tid] = setTimeout(function() {
                    me.fn.apply(ctx, a);
                }, ms);
                return v;
            },
            reset : function() {
                this.count = 0;
                buffer_stop.call(this.enable());
            },
            stop : function() {
                !(tid in this) || clearTimeout(this[tid]), delete this[tid];
            }
        };
    }());
    __lib__.define(NS("Hash"), function() {
        var ID = "__hashid__", cache = [];
        return {
            constructor : function Hash(o) {
                util.def(this, ID, util.describe(cache.push(util.obj()) - 1, "w"));
                util.nativeType(o) != "object" || this.set(o);
            },
            module : __lib__,
            keys : {
                get : function() {
                    return Object.keys(cache[this[ID]]);
                }
            },
            length : {
                get : function() {
                    return this.keys.length;
                }
            },
            values : {
                get : function() {
                    return Object.values(cache[this[ID]]);
                }
            },
            aggregate : function(val, fn, ctx) {
                var H = this, o = cache[this[ID]];
                ctx || (ctx = H);
                return Object.keys(o).reduce(function(res, k, i) {
                    return fn.call(ctx, res, o[k], k, H, i);
                }, val);
            },
            clear : function() {
                cache[this[ID]] = util.obj();
            },
            clone : function() {
                return new __lib__.Hash(this.valueOf());
            },
            each : function(fn, ctx) {
                var H = this, o = cache[H[ID]];
                ctx || (ctx = H);
                Object.keys(o).forEach(function(k, i) {
                    fn.call(ctx, o[k], k, H, i);
                }, H);
            },
            get : function(k) {
                return util.has(cache[this[ID]], k) ? cache[this[ID]][k] : null;
            },
            has : function(k) {
                return util.has(cache[this[ID]], k);
            },
            key : function(v) {
                return Object.key(cache[this[ID]], v);
            },
            reduce : function(fn, val) {
                var H = this, o = cache[H[ID]];
                return Object.keys(o).reduce(function(res, k, i) {
                    return fn.call(H, res, o[k], k, H, i);
                }, val);
            },
            remove : function(k) {
                return util.has(cache[this[ID]], k) ? delete cache[this[ID]][k] : false;
            },
            set : function(o, v) {
                switch (util.nativeType(o)) {
                  case "object":
                    Object.keys(o).forEach(function(k) {
                        this.set(k, o[k]);
                    }, this);
                    break;
                  default:
                    cache[this[ID]][o] = v;
                }
            },
            stringify : function() {
                return JSON.stringify(cache[this[ID]]);
            },
            toString : function() {
                return util.tostr(cache[this[ID]]);
            },
            valueOf : function() {
                return util.copy(util.obj(), cache[this[ID]]);
            }
        };
    }());
    __lib__.define(NS("Observer"), function() {
        function addObservers(observers) {
            observers = util.copy(util.obj(), observers);
            var ctx = observers.ctx, k, l, o, opt = observers.options, s;
            Object.remove(observers, "ctx", "options");
            for (k in observers) {
                l = observers[k];
                o = l.options === U ? l.options : opt;
                s = l.ctx === U ? l.ctx : ctx;
                switch (util.nativeType(l)) {
                  case "function":
                    this.observe(k, l, ctx, opt);
                    break;
                  case "object":
                    switch (util.nativeType(l.fn)) {
                      case "function":
                      case "object":
                        this.observe(k, l.fn, s, o);
                        break;
                      case "array":
                        l.fn.forEach(function(fn) {
                            this.observe(k, fn, s, o);
                        }, this);
                        break;
                    }
                    break;
                  case "array":
                    l.forEach(function(fn) {
                        this.observe(k, fn, ctx, opt);
                    }, this);
                    break;
                }
            }
            return this;
        }
        function broadcast(cb) {
            var args = this.args.concat(cb.options.args), ctx = cb.ctx || this.ctx, fire = cb.fire || cb.fn;
            if (!util.nativeType(fire) == "function") return true;
            if (!!Object.key(this.ctx, cb.fn)) args[0] !== this.ctx || args.shift(); else if (args[0] !== this.ctx) args.unshift(this.ctx);
            return fire.apply(ctx, args) !== false;
        }
        function createRelayCallback(ctxr, ctx, evt) {
            return function Observer_relayedCallback() {
                var args = Array.coerce(arguments);
                !(args[0] === ctxr) || args.shift();
                args.unshift(evt, ctx);
                return relay.apply(ctx, args);
            };
        }
        function createSingleCallback(event, cb) {
            var ctx = this;
            return cb.fire = function Observer_singleCallback() {
                ctx.ignore(event, cb.fn, cb.ctx);
                if (cb.fired) return;
                cb.fired = true;
                return cb.fn.apply(cb.ctx || ctx, arguments);
            };
        }
        function find(e, o) {
            var i = -1, l = e.length;
            while (++i < l) if (matchCallback(o, e[i])) return e[i];
            return null;
        }
        function getObserver(r, v, k) {
            var m;
            return k === this || util.nativeType(m = this.match(k)) == "array" && m[0] === this ? r.concat(v) : r;
        }
        function getObservers(o, e) {
            return o.listeners.aggregate([], getObserver, e);
        }
        function handleEvent(cb) {
            return function handleEvent() {
                return cb.handleEvent.apply(cb, arguments);
            }.mimic(cb.fire);
        }
        function matchCallback(o, cb) {
            return (o.isCB === true ? cb.fn.valueOf() === o.ctx.fire : cb.fn === o.fn) && cb.ctx === o.ctx && cb.event === o.event;
        }
        function relay() {
            return this.broadcast.apply(this, arguments);
        }
        function wildCardEsc(e) {
            return e.replace(re_wc, ".*");
        }
        var U, listener_id = 0, re_wc = /\*/g;
        return {
            constructor : function Observer(observers) {
                this.broadcasting = false;
                this.destroyed = false;
                this.observer_suspended = false;
                this.listeners = __lib__("Hash");
                util.nativeType(observers) != "object" || this.observe(observers);
                util.nativeType(this.observers) != "object" || this.observe(this.observers), delete this.observers;
            },
            module : __lib__,
            broadcast : function(event) {
                if (this.destroyed || this.observer_suspended || !this.listeners.length || !event) return;
                var args = Array.coerce(arguments, 1), e = getObservers(this, event);
                if (!e.length) return;
                this.broadcasting = event;
                e.every(broadcast, {
                    args : args,
                    ctx : this
                });
                this.broadcasting = false;
            },
            buffer : function(ms, evt, fn, ctx, o) {
                util.nativeType(o) == "object" || (o = util.obj());
                o.buffer = Number(ms);
                this.observe(evt, fn, ctx, o);
            },
            delay : function(ms, evt, fn, ctx, o) {
                util.nativeType(o) == "object" || (o = util.obj());
                o.delay = Number(ms);
                this.observe(evt, fn, ctx, o);
            },
            destroy : function() {
                if (this.destroyed) return true;
                if (this.broadcast("before:destroy") === false) return false;
                this.destroyed = true;
                this._destroy();
                this.broadcast("destroy");
                this.observer_suspended = true;
                delete this.listeners;
                return true;
            },
            ignore : function(event, fn, ctx) {
                event = wildCardEsc(event.toLowerCase());
                var e = this.listeners.get(event), i, o;
                if (!e) return;
                switch (util.type(fn)) {
                  case Name + "-callback":
                    o = {
                        ctx : fn,
                        isCB : true
                    };
                    break;
                  default:
                    o = {
                        ctx : ctx || this,
                        fn : fn
                    };
                }
                o.event = event;
                o = find(e, o);
                if (o !== null) {
                    i = e.indexOf(o);
                    i < 0 || e.splice(i, 1);
                }
            },
            observe : function(event, fn, ctx, o) {
                var cb, e = this.listeners, fnt, q;
                if (util.nativeType(event) == "object") return addObservers.call(this, event);
                switch (fnt = util.type(fn)) {
                  case "array":
                    cb = util.obj();
                    cb[event] = {
                        fn : fn,
                        options : o,
                        ctx : ctx
                    };
                    return addObservers.call(this, cb);
                  case "object":
                  case "nullobject":
                  case Name + "-callback":
                    if ("handleEvent" in fn) {
                        !(util.nativeType(ctx) == "object" && o === U) || (o = ctx);
                        ctx = fn;
                        fn = handleEvent(fn);
                    }
                    break;
                  case "string":
                    !ctx || (fn = ctx[fn]);
                    break;
                }
                event = wildCardEsc(event.toLowerCase());
                (q = e.get(event)) || e.set(event, q = []);
                switch (util.nativeType(o)) {
                  case "boolean":
                    o = {
                        single : !!o
                    };
                    break;
                  case "number":
                    o = {
                        delay : o
                    };
                    break;
                  case "object":
                    o = util.copy(util.obj(), o);
                    break;
                  default:
                    o = util.obj();
                }
                Array.isArray(o.args) || (o.args = []);
                cb = {
                    ctx : ctx || this,
                    event : event,
                    fn : fn,
                    id : ++listener_id,
                    options : o
                };
                cb.fire = (o.single ? createSingleCallback.call(this, event, cb) : cb.fn).callback({
                    args : o.args,
                    buffer : o.buffer,
                    ctx : cb.ctx,
                    delay : o.delay
                });
                q.push(cb);
            },
            once : function(evt, fn, ctx, o) {
                util.nativeType(o) == "object" || (o = util.obj());
                o.single = true;
                this.observe(evt, fn, ctx, o);
            },
            purgeObservers : function(event) {
                var e = this.listeners;
                if (!event) {
                    e.clear();
                    return;
                }
                event = event.toLowerCase();
                !e.has(event) || e.set(event, []);
            },
            relayEvents : function(o) {
                var e = Array.coerce(arguments, 1), evt;
                while (evt = e.shift()) this.observe(evt, createRelayCallback(this, o, evt), o);
            },
            resumeEvents : function() {
                !this.observer_suspended || (this.observer_suspended = false, this.broadcast("observer:resumed"));
            },
            suspendEvents : function() {
                this.observer_suspended || (this.observer_suspended = true, this.broadcast("observer:suspended"));
            },
            _destroy : util.noop
        };
    }());
}(typeof m8 != "undefined" ? m8 : typeof require != "undefined" ? require("m8") : null, "id8");