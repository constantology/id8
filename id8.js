!function(m8) {
    "use strict";
    function rm(k) {
        delete this[k];
    }
    var U, id8;
    m8.x.cache("Function", function(Type) {
        m8.def(Type.prototype, "callback", m8.describe(function(conf) {
            return (new id8.Callback(this, conf)).fire.mimic(this);
        }, "w"));
    });
    m8.x.cache("Object", function(Type) {
        m8.defs(Type, {
            key : function(o, v) {
                for (var k in o) if (m8.has(o, k) && o[k] === v) return k;
                return null;
            },
            remove : function(o, keys) {
                (Array.isArray(keys) ? keys : Array.coerce(arguments, 1)).forEach(rm, o);
                return o;
            }
        }, "w");
    });
    m8.x(Object, Array, Boolean, Function);
    !function() {
        id8 = function(n) {
            var C = m8.type(n) == "class" ? n : reg_type[n] || reg_type["id8_" + n] || reg_path[n];
            if (!C) new Error(n + " does not match any registered id8.Class.");
            return C.create.apply(null, Array.coerce(arguments, 1));
        };
        function Class(path, desc) {
            if (!desc && m8.nativeType(path) == "object") {
                desc = path;
                path = "";
            }
            var C, name, ns, _ctor, type, _proto = m8.obj(), _super = desc.extend || Object, mod = desc.module, mixin = desc.mixin || dumb, singleton = desc.singleton;
            m8.nativeType(_super) != "string" || (_super = reg_path[_super] || reg_type[_super]);
            _ctor = desc.constructor !== Object ? desc.constructor : _super;
            if (path) {
                ns = path.split(".");
                name = ns.pop();
                ns = m8.bless(ns, mod);
            }
            m8.def(_proto, "parent", desc_noop, true);
            m8.def(_proto, "constructor", m8.describe(ctor(_ctor, _super, name, _proto), "w"), true);
            type = getType(desc.type || path, C = _proto.constructor);
            m8.def(C, "__type__", m8.describe("class", "w"), true);
            m8.def(_proto, "__type__", m8.describe(type, "w"), true);
            Object.remove(desc, defaults);
            C.prototype = apply(_proto, m8.copy(desc, mixin));
            m8.def(C, "create", m8.describe(create(extend(C, _super)), "w"), true);
            path = path.replace(re_root, "");
            if (singleton) {
                m8.def(C, "singleton", m8.describe({
                    value : singleton === true ? new C : C.create.apply(C, [].concat(singleton))
                }, "w"));
                register(C, path, type);
                C = C.singleton;
            } else if (path) register(C, path, type);
            !(name && ns) || m8.def(ns, name, m8.describe({
                value : C
            }, "w"));
            return C;
        }
        function apply(proto, desc) {
            Object.reduce(desc, function(p, v, k) {
                switch (m8.nativeType(v)) {
                  case "object":
                    m8.def(p, k, v, true);
                    break;
                  default:
                    p[k] = v;
                }
                return p;
            }, proto);
            return proto;
        }
        function create(C) {
            return function create() {
                return singleton(C) || C.apply(Object.create(C.prototype), arguments);
            };
        }
        function ctor(m, s, name, P) {
            var C = wrap(m, s, name), Ctor = function() {
                var ctx = this === U ? null : this, ctor = ctx ? ctx.constructor : null;
                return singleton(ctor) || C.apply(is(ctx, Ctor) ? ctx : Object.create(P), arguments);
            };
            return Ctor.mimic(m, name);
        }
        function extend(C, Sup) {
            if (!("__super" in C.prototype)) {
                var p = C.prototype, sp = Sup.prototype;
                Object.keys(sp).forEach(function(k) {
                    if (k in reserved) return;
                    switch (m8.type(sp[k])) {
                      case "function":
                        p[k] = m8.nativeType(p[k]) != "function" ? wrap(sp[k], m8.noop, k) : wrap(p[k], sp[k], k);
                        break;
                      default:
                        k in p || m8.def(p, k, Object.getOwnPropertyDescriptor(sp, k), true);
                    }
                });
                Object.keys(p).forEach(function(k) {
                    !(m8.nativeType(p[k]) == "function" && (!(k in sp) || p[k].valueOf() !== sp[k].valueOf())) || (p[k] = wrap(p[k], m8.noop, k));
                });
                sp = m8.describe({
                    value : Object.create(Sup.prototype)
                }, "w");
                m8.def(C, "__super", sp);
                m8.def(C.prototype, "__super", sp);
            }
            return C;
        }
        function getType(type, ctor) {
            return (!m8.empty(type) ? type.replace(re_root, "").replace(re_dot, "_") : ctor.__name__).toLowerCase();
        }
        function is(o, C) {
            if (o && C) {
                if (o instanceof C) return true;
                if (!(o = o.constructor)) return false;
                do {
                    if (o === C) return true;
                } while (o.__super && (o = o.__super.constructor));
            }
            return false;
        }
        function register(C, path, type) {
            var err, err_msg = path + ERR_MSG;
            !path || !(path in reg_path) || (err = true, console.log(err_msg + "Class"));
            !type || !(type in reg_type) || (err = true, console.log(err_msg + "Type"));
            if (err) new Error("id8.Class overwrite error.");
            reg_path[path] = reg_type[type] = C;
        }
        function singleton(C) {
            return !C ? null : C.singleton || null;
        }
        function type(c) {
            var ctor = c.constructor, k;
            for (k in reg_path) if (reg_path[k] === ctor) return k;
            return ctor.__name__ != "anonymous" ? ctor.__name__ : "Anonymous";
        }
        function wrap(m, s, name) {
            return function() {
                var o, p = Object.getOwnPropertyDescriptor(this, "parent") || desc_noop;
                p.writable = true;
                m8.def(this, "parent", s ? m8.describe(s, "cw") : desc_noop, true);
                o = m.apply(this, arguments);
                m8.def(this, "parent", p, true);
                return this.chain !== false && o === U ? this : o;
            }.mimic(m, name);
        }
        var ERR_MSG = " already exists. Cannot override existing ", defaults = "constructor extend mixin module singleton type".split(" "), desc_noop = m8.describe(m8.noop, "cw"), dumb = m8.obj(), re_dot = /\./g, re_root = /^\u005E/, reg_path = m8.obj(), reg_type = m8.obj(), reserved = m8.obj();
        reserved.constructor = reserved.parent = reserved.__super = reserved.__type__ = true;
        m8.defs(id8, {
            Class : Class,
            is : is,
            type : type
        }, "w");
    }();
    m8.def(id8, "m8", m8.describe({
        value : m8
    }, "r"));
    m8.ENV != "commonjs" ? m8.def(m8.global, "id8", m8.describe({
        value : id8
    }, "r")) : module.exports = id8;
    id8.Class("^id8.Callback", function() {
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
                m8.copy(this, conf || {});
                var desc = m8.describe(null, "w"), fire = (m8.type(this.buffer) == "number" ? buffer : this.exec).bind(this);
                desc.value = fn;
                m8.def(this, "fn", desc);
                desc.value = this;
                m8.def(fire, "cb", desc);
                desc.value = fire;
                m8.def(this, "fire", desc);
                this.args || (this.args = []);
                this.ctx || (this.ctx = this);
                m8.type(this.delay) == "number" || (this.delay = null);
                m8.type(this.times) == "number" && this.times > 0 || (this.times = 0);
                this.enable();
            },
            chain : true,
            module : id8,
            buffer : null,
            count : 0,
            delay : null,
            times : 0,
            disable : function() {
                this.disabled = true;
                this.handleEvent = m8.noop;
            },
            enable : function() {
                this.disabled = false;
                this.handleEvent = handleEvent;
            },
            exec : function() {
                if (this.disabled) return;
                this.times === 0 || this.times > ++this.count || this.disable();
                var a = Array.coerce(arguments), me = this, ctx = me.ctx, ms = me.delay, t = m8.type(a[0]), v;
                t && (eventType(t) || t == "id8_observer") ? a.splice.apply(a, [ 1, 0 ].concat(me.args)) : a.unshift.apply(a, me.args);
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
    id8.Class("^id8.Hash", function() {
        var ID = "__hashid__", cache = [];
        return {
            constructor : function Hash(o) {
                m8.def(this, ID, m8.describe(cache.push(m8.obj()) - 1, "w"));
                m8.nativeType(o) != "object" || this.set(o);
            },
            module : id8,
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
                cache[this[ID]] = m8.obj();
            },
            clone : function() {
                return new id8.Hash(this.valueOf());
            },
            each : function(fn, ctx) {
                var H = this, o = cache[H[ID]];
                ctx || (ctx = H);
                Object.keys(o).forEach(function(k, i) {
                    fn.call(ctx, o[k], k, H, i);
                }, H);
            },
            get : function(k) {
                return m8.has(cache[this[ID]], k) ? cache[this[ID]][k] : null;
            },
            has : function(k) {
                return m8.has(cache[this[ID]], k);
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
                return m8.has(cache[this[ID]], k) ? delete cache[this[ID]][k] : false;
            },
            set : function(o, v) {
                switch (m8.nativeType(o)) {
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
                return m8.tostr(cache[this[ID]]);
            },
            valueOf : function() {
                return m8.copy(m8.obj(), cache[this[ID]]);
            }
        };
    }());
    id8.Class("^id8.Observer", function() {
        function addObservers(observers) {
            observers = m8.copy(m8.obj(), observers);
            var ctx = observers[_ctx], k, l, o, opt = observers[_options], s;
            Object.remove(observers, _ctx, _options);
            for (k in observers) {
                l = observers[k];
                o = l[_options] === U ? l[_options] : opt;
                s = l[_ctx] === U ? l[_ctx] : ctx;
                switch (m8.nativeType(l)) {
                  case "function":
                    this.observe(k, l, ctx, opt);
                    break;
                  case "object":
                    switch (m8.nativeType(l[_fn])) {
                      case "function":
                      case "object":
                        this.observe(k, l[_fn], s, o);
                        break;
                      case "array":
                        l[_fn].forEach(function(fn) {
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
            var args = this.args.concat(cb[_options].args), ctx = cb[_ctx] || this[_ctx], fire = cb.fire || cb[_fn];
            if (!m8.nativeType(fire) == "function") return true;
            if (!!Object.key(this[_ctx], cb[_fn])) args[0] !== this[_ctx] || args.shift(); else if (args[0] !== this[_ctx]) args.unshift(this[_ctx]);
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
                ctx.ignore(event, cb[_fn], cb[_ctx]);
                if (cb.fired) return;
                cb.fired = true;
                return cb[_fn].apply(cb[_ctx] || ctx, arguments);
            };
        }
        function find(e, o) {
            var i = -1, l = e.length;
            while (++i < l) if (matchCallback(o, e[i])) return e[i];
            return null;
        }
        function getObserver(r, v, k) {
            var m;
            return k === this || m8.nativeType(m = this.match(k)) == "array" && m[0] === this ? r.concat(v) : r;
        }
        function getObservers(o, e) {
            return o[_observers].aggregate([], getObserver, e);
        }
        function handleEvent(cb) {
            return function handleEvent() {
                return cb.handleEvent.apply(cb, arguments);
            }.mimic(cb.fire);
        }
        function matchCallback(o, cb) {
            return (o.isCB === true ? cb[_fn].valueOf() === o[_ctx].fire : cb[_fn] === o[_fn]) && cb[_ctx] === o[_ctx] && cb.event === o.event;
        }
        function relay() {
            return this.broadcast.apply(this, arguments);
        }
        function wildCardEsc(e) {
            return e.replace(re_wc, ".*");
        }
        var _broadcasting = "broadcasting", _ctx = "ctx", _destroyed = "destroyed", _fn = "fn", _observers = "listeners", _options = "options", _suspended = "observer_suspended", listener_id = 0, re_wc = /\*/g;
        return {
            constructor : function Observer(observers) {
                this[_broadcasting] = false;
                this[_destroyed] = false;
                this[_suspended] = false;
                this[_observers] = id8.Hash();
                m8.nativeType(observers) != "object" || this.observe(observers);
                m8.nativeType(this.observers) != "object" || this.observe(this.observers), delete this.observers;
            },
            module : id8,
            broadcast : function(event) {
                if (this[_destroyed] || this[_suspended] || !this[_observers].length || !event) return;
                var args = Array.coerce(arguments, 1), e = getObservers(this, event);
                if (!e.length) return;
                this[_broadcasting] = event;
                e.every(broadcast, {
                    args : args,
                    ctx : this
                });
                this[_broadcasting] = false;
            },
            buffer : function(ms, evt, fn, ctx, o) {
                m8.nativeType(o) == "object" || (o = m8.obj());
                o.buffer = Number(ms);
                this.observe(evt, fn, ctx, o);
            },
            delay : function(ms, evt, fn, ctx, o) {
                m8.nativeType(o) == "object" || (o = m8.obj());
                o.delay = Number(ms);
                this.observe(evt, fn, ctx, o);
            },
            destroy : function() {
                if (this[_destroyed]) return true;
                if (this.broadcast("before:destroy") === false) return false;
                this[_destroyed] = true;
                this._destroy();
                this.broadcast("destroy");
                this[_suspended] = true;
                delete this[_observers];
                return true;
            },
            ignore : function(event, fn, ctx) {
                event = wildCardEsc(event.toLowerCase());
                var e = this[_observers].get(event), i, o;
                if (!e) return;
                switch (m8.type(fn)) {
                  case "id8_callback":
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
                var cb, e = this[_observers], fnt, q;
                if (m8.nativeType(event) == "object") return addObservers.call(this, event);
                switch (fnt = m8.type(fn)) {
                  case "array":
                    cb = m8.obj();
                    cb[event] = {
                        fn : fn,
                        options : o,
                        ctx : ctx
                    };
                    return addObservers.call(this, cb);
                  case "object":
                  case "nullobject":
                  case "id8_callback":
                    if ("handleEvent" in fn) {
                        !(m8.nativeType(ctx) == "object" && o === U) || (o = ctx);
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
                switch (m8.nativeType(o)) {
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
                    o = m8.copy(m8.obj(), o);
                    break;
                  default:
                    o = m8.obj();
                }
                Array.isArray(o.args) || (o.args = []);
                cb = {
                    ctx : ctx || this,
                    event : event,
                    fn : fn,
                    id : ++listener_id,
                    options : o
                };
                cb.fire = (o.single ? createSingleCallback.call(this, event, cb) : cb[_fn]).callback({
                    args : o.args,
                    buffer : o.buffer,
                    ctx : cb[_ctx],
                    delay : o.delay
                });
                q.push(cb);
            },
            once : function(evt, fn, ctx, o) {
                m8.nativeType(o) == "object" || (o = m8.obj());
                o.single = true;
                this.observe(evt, fn, ctx, o);
            },
            purgeObservers : function(event) {
                var e = this[_observers];
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
                !this[_suspended] || (this[_suspended] = false, this.broadcast("observer:resumed"));
            },
            suspendEvents : function() {
                this[_suspended] || (this[_suspended] = true, this.broadcast("observer:suspended"));
            },
            _destroy : m8.noop
        };
    }());
}(typeof m8 != "undefined" ? m8 : typeof require != "undefined" ? require("m8") : null);