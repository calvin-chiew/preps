var canvas;
var gl;
var shaderProgram;
var mvMatrix;
var pMatrix;
var boxVbo;
var circleVbo;

var B2D = {}; // box2d container
var drawables = [];
var timer;
const MAX_TIMESTEPS_PER_REDRAW = 10;
const SHAPE_COLORS = [
    [0.5, 0.5, 1.0],
    [0.3, 1.0, 0.5],
    [0.8, 0.8, 1.0],
    [1.0, 0.8, 0.5],
    [1.0, 0.5, 0.5],
    [1.0, 1.0, 0.1],
]

var fpsTimer;
var fpsTimerCallback = function(fps) {};

var config = {
    seconds_between_spawn: 0.5,
    zoom: 15.0,
    kill_y: -20,
    physics_timestep: 1.0 / 60,
    circle_detail: 30
}

function updateCircleDetail(detail) {
    config.circle_detail = detail;
    circleVbo.destroy();
    circleVbo = createCircleVbo(gl, detail);
}

var seconds_until_spawn = config.seconds_between_spawn;


const FRAGMENT_SHADER_SRC = [
    '#ifdef GL_ES',
    'precision highp float;',
    '#endif',

    'uniform vec4 uColor;',

    'void main(void) {',
    '    gl_FragColor = uColor;',
    '}',
].join('\n')

const VERTEX_SHADER_SRC = [
    'attribute vec3 aVertexPosition;',

    'uniform mat3 uMVMatrix;',
    'uniform mat3 uPMatrix;',

    'void main(void) {',
    '    vec2 vPos = vec2(aVertexPosition);',
    '    vec3 pos = uPMatrix * uMVMatrix * vec3(vPos, 1.0);',
    '    gl_Position = vec4(pos, 1.0);',
    '}',
].join('\n')

function random_choice(array) {
    var i = Math.floor(Math.random() * array.length);
    return array[i];
}

function GameObject(kwargs) {
    var draw_func = kwargs.draw;
    var should_kill_func = kwargs.should_kill || (function() { return false });
    var kill_func = kwargs.kill || (function() { });
    return { draw: draw_func, should_kill: should_kill_func, kill: kill_func }
}

function Box(body, boxDef, fill_color) {
    var pos = body.GetPosition();
    var xsize = boxDef.xsize;
    var ysize = boxDef.ysize;
    var localpos = boxDef.center || null;
    var localangle = boxDef.angle || null;
    return GameObject({
        draw: function() {
            var angle = body.GetAngle();
            Mat3.identity(mvMatrix);
            Mat3.translate(mvMatrix, pos.x, pos.y);
            Mat3.rotate(mvMatrix, angle);
            if (localpos)
                Mat3.translate(mvMatrix, localpos.x, localpos.y);
            if (localangle)
                Mat3.rotate(mvMatrix, localangle);
            Mat3.scale(mvMatrix, xsize, ysize);
            setMVMatrixUniform();
            
            boxVbo.bind();
            setColor(fill_color[0], fill_color[1], fill_color[2]);
            boxVbo.drawFill();
            setColor(0.0, 0.0, 0.0);
            boxVbo.drawOutline();
        },
        should_kill: function() {
            return pos.y <= config.kill_y;
        },
        kill: function() {
            B2D.world.DestroyBody(body);
        }
    });
}

function Circle(body, radius, fill_color) {
    var pos = body.GetPosition();
    return GameObject({
        draw: function() {
            Mat3.identity(mvMatrix);
            Mat3.translate(mvMatrix, pos.x, pos.y);
            Mat3.scale(mvMatrix, radius, radius);
            setMVMatrixUniform();
            
            circleVbo.bind();
            setColor(fill_color[0], fill_color[1], fill_color[2]);
            circleVbo.drawFill();
            setColor(0.0, 0.0, 0.0);
            circleVbo.drawOutline();
        },
        should_kill: function() {
            return pos.y <= config.kill_y;
        },
        kill: function() {
            B2D.world.DestroyBody(body);
        }
    });
}

function Pin(pos, radius, fill_color) {
    return GameObject({
        draw: function() {
            Mat3.identity(mvMatrix);
            Mat3.translate(mvMatrix, pos.x, pos.y);
            Mat3.scale(mvMatrix, radius, radius);
            setMVMatrixUniform();
            
            circleVbo.bind();
            setColor(fill_color[0], fill_color[1], fill_color[2]);
            circleVbo.drawFill();
            setColor(0.0, 0.0, 0.0);
            circleVbo.drawOutline();
        }
    });
}

function StepTimer() {
    var last_clock = new Date().getTime();
    var delta = 0;
    
    var update_clock = function() {
        var new_clock = new Date().getTime();
        delta += (new_clock - last_clock);
        last_clock = new_clock;
    }
    
    return {
        consume_frame: function(timestep) {
            var timestepMs = timestep * 1000;
            update_clock();
            if (delta < timestepMs)
                return false;
            delta -= timestepMs;
            return true;
        },
        reset: function() {
            last_clock = new Date().getTime();
            delta = 0;
        }
    }
}

function FpsTimer() {
    var last_clock = new Date().getTime();
    var count = 0;
    var sum = 0;
    var max_count = 100;
    var max_sum = 1;
    var values = [];

    return {
        currentFps: function() {
            var new_clock = new Date().getTime();
            var timestep = (new_clock - last_clock) / 1000;
            last_clock = new_clock;
            sum += timestep;
            values.push(timestep);
            if (values.length > max_count) {
                sum -= values.shift();
            }
            while (sum > max_sum && values.length > 1) {
                sum -= values.shift();
            }
            var averaged_timestep = sum / values.length;
            return 1.0 / averaged_timestep;
        }
    }
}

function init(canvas) {
    gl = WebGLUtils.create3DContext(canvas, null);
    if (!gl) {
        throw {
            name: 'WebGL Error',
            message: 'Failed to create GL context.'
        }
    }

    initShaders();
    boxVbo = createBoxVbo(gl);
    circleVbo = createCircleVbo(gl, 30);
    
    mvMatrix = Mat3.create();
    pMatrix = Mat3.create();
    
    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    reshape(canvas.width, canvas.height);
    
    initBox2d();
    draw();

    timer = StepTimer();
    fpsTimer = FpsTimer();
    tick();
}

function possibly_kill_drawables() {
    var nothing_to_kill = true;
    for (var i = 0; i < drawables.length; i++) {
        if (drawables[i].should_kill()) {
            nothing_to_kill = false;
            break;
        }
    }
    if (nothing_to_kill) return;
    
    var new_drawables = [];
    for (var i = 0; i < drawables.length; i++) {
        var obj = drawables[i];
        if (obj.should_kill())
            obj.kill();
        else
            new_drawables.push(obj);
    }
    drawables = new_drawables;
}

function tick() {
    var steps = 0;
    var timestep = config.physics_timestep;
    while (timer.consume_frame(timestep)) {
        possibly_kill_drawables();
        steps++;
        seconds_until_spawn -= timestep;
        while (seconds_until_spawn <= 0) {
            add_random_shape();
            seconds_until_spawn += config.seconds_between_spawn;
        }
        B2D.world.Step(timestep, 5);
        if (steps >= MAX_TIMESTEPS_PER_REDRAW) {
            // consider this a "pause" and reset the timer
            timer.reset();
            break;
        }
    }
    if (steps > 0) {
        draw();
        fpsTimerCallback(fpsTimer.currentFps());
    }
    window.requestAnimFrame(tick);
}

function add_ball(x, y, radius, color, kwargs) {
    var shapeDef = new b2CircleDef();
    shapeDef.radius = radius;
    shapeDef.density = kwargs.density || 1.0;
    shapeDef.friction = kwargs.friction || 0.3;
    var bodyDef = new b2BodyDef();
    bodyDef.position.Set(x, y);
    var body = B2D.world.CreateBody(bodyDef);
    body.CreateShape(shapeDef);
    body.SetMassFromShapes();
    drawables.push(Circle(body, radius, color));
}

function add_random_ball() {
    x = -8 + Math.random() * 4;
    y = 15;
    radius = 0.5 + Math.random() * 0.5;
    add_ball(x, y, radius, random_choice(SHAPE_COLORS), {})
}

function add_static_box(x, y, xsize, ysize, color) {
    var shapeDef = new b2PolygonDef();
    shapeDef.SetAsBox(xsize, ysize);
    var bodyDef = new b2BodyDef();
    bodyDef.position.Set(x, y);
    var body = B2D.world.CreateBody(bodyDef);
    body.CreateShape(shapeDef);
    drawables.push(Box(body, {xsize: xsize, ysize: ysize}, color));
}

function add_dynamic_box(x, y, xsize, ysize, color, kwargs) {
    var shapeDef = new b2PolygonDef();
    shapeDef.SetAsBox(xsize, ysize);
    shapeDef.density = kwargs.density || 1.0;
    shapeDef.friction = kwargs.friction || 0.3;
    var bodyDef = new b2BodyDef();
    bodyDef.position.Set(x, y);
    var body = B2D.world.CreateBody(bodyDef);
    body.CreateShape(shapeDef);
    body.SetMassFromShapes();
    drawables.push(Box(body, {xsize: xsize, ysize: ysize}, color));
}

function add_random_box() {
    x = -8 + Math.random() * 4;
    y = 15;
    size = 0.4 + Math.random() * 0.5;
    add_dynamic_box(x, y, size, size, random_choice(SHAPE_COLORS), {})
}

function add_random_shape() {
    if (Math.random() < 0.9)
        add_random_ball();
    else
        add_random_box();
}

function radians(degrees) {
    return degrees * Math.PI / 180;
}

function add_L_shape(x, y, color, kwargs) {
    var thickness = kwargs.thickness || 0.5;
    var density = kwargs.density || 1.0;
    var friction = kwargs.friction || 0.3;
    var xlength = kwargs.xlength || 13.0;
    var ylength = kwargs.ylength || 4.0;
    
    var shape1 = {
        xsize: thickness,
        ysize: ylength,
        center: new b2Vec2(thickness - xlength, 0),
        angle: 0
    }
    var shape2 = {
        xsize: xlength,
        ysize: thickness,
        center: new b2Vec2(0, thickness - ylength),
        angle: 0
    }
    
    var bodyDef = new b2BodyDef();
    bodyDef.position.Set(x, y);
    var body = B2D.world.CreateBody(bodyDef);

    var shape = new b2PolygonDef();
    shape.SetAsOrientedBox(shape1.xsize, shape1.ysize, shape1.center, shape1.angle);
    shape.density = density;
    shape.friction = friction;
    body.CreateShape(shape);

    shape = new b2PolygonDef();
    shape.SetAsOrientedBox(shape2.xsize, shape2.ysize, shape2.center, shape2.angle);
    shape.density = density;
    shape.friction = friction;
    body.CreateShape(shape);
    
    body.SetMassFromShapes();
    drawables.push(Box(body, shape1, color));
    drawables.push(Box(body, shape2, color));
    
    var jointDef = new b2RevoluteJointDef();
    var anchor = new b2Vec2(x - 2.54, y - ylength + thickness);
    jointDef.Initialize(body, B2D.staticBody, anchor);
    jointDef.lowerAngle = radians(-10);
    jointDef.upperAngle = radians(25);
    jointDef.enableLimit = true;
    B2D.world.CreateJoint(jointDef);
    drawables.push(Pin(anchor, thickness*0.7, [0.5, 0.5, 0.5]))
}

function initBox2d() {
    var worldAABB = new b2AABB();
    worldAABB.lowerBound.Set(-100.0, -100.0);
    worldAABB.upperBound.Set(100.0, 100.0);
    var gravity = new b2Vec2(0.0, -10.0);
    var doSleep = true;
    B2D.world = new b2World(worldAABB, gravity, doSleep);
    B2D.staticBody = B2D.world.CreateBody(new b2BodyDef());
    
    //add_static_box(0, -10, 50, 10, [0.6, 0.3, 0.2]); // ground
    //add_ball(0.0, 5.0, 0.5, [0.5, 0.5, 1.0], {});
    //add_dynamic_box(0.5, 8.0, 0.5, 0.5, [0.5, 0.8, 0.5], {});
    add_L_shape(0, -1, [0.2, 0.5, 0.7], {density: 0.1});
}

function reshape(w, h) {
    gl.viewport(0, 0, w, h);
    var wsize = (w+h)*0.5;
    var xsize = config.zoom * w / wsize;
    var ysize = config.zoom * h / wsize;
    config.kill_y = Math.min(-ysize - 5, -20);
    Mat3.ortho2D(pMatrix, -xsize, xsize, -ysize, ysize);
    setPMatrixUniform();
}

function createShader(src, type) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw {
            name: 'Shader compile error',
            message: gl.getShaderInfoLog(shader)
        }
    }
    return shader;
}

function initShaders() {
    var vertexShader = createShader(VERTEX_SHADER_SRC, gl.VERTEX_SHADER);
    var fragmentShader = createShader(FRAGMENT_SHADER_SRC, gl.FRAGMENT_SHADER);
    
    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        var message = gl.getProgramInfoLog(shaderProgram) || 'Unknown error';
        throw {
            name: 'Shader link error',
            message: message
        }
    }
    gl.useProgram(shaderProgram);

    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
    
    shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
    shaderProgram.glColorUniform = gl.getUniformLocation(shaderProgram, "uColor");
}

function setPMatrixUniform() {
    gl.uniformMatrix3fv(shaderProgram.pMatrixUniform, false, pMatrix);
}

function setMVMatrixUniform() {
    gl.uniformMatrix3fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}

function setColor(r, g, b) {
    gl.uniform4f(shaderProgram.glColorUniform, r, g, b, 1.0);
}

function draw() {
    gl.clear(gl.COLOR_BUFFER_BIT);
    for (var i = 0; i < drawables.length; i++)
        drawables[i].draw();
}
