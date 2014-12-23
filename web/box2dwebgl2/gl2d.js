
function createStaticFloatVbo(gl, vertices, itemSize, numItems) {
    var vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    return {
        numItems: numItems,
        
        bind: function(vertexPositionAttribute) {
            gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
            gl.vertexAttribPointer(vertexPositionAttribute, itemSize, gl.FLOAT, false, 0, 0);
        }
    };
};

function createTextureVbo(gl) {
    var vertices = [
        0, 0,
        0, 1,
        1, 1,
        1, 0,
    ];
    var vbo = createStaticFloatVbo(gl, vertices, 2, 4);
    return {
        bind: vbo.bind,
        activate: function(texture, samplerUniform, textureIndex) {
            var i = textureIndex || 0;
            gl.activeTexture(gl.TEXTURE0 + i);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.uniform1i(samplerUniform, i);
        }
    }
}

function createBoxVbo(gl) {
    // Why use 5 vertices for a box?
    // Because gl.LINE_LOOP is buggy in both chrome and firefox, so we use
    // gl.LINE_STRIP instead, with the same vertex first and last.
    var vertices = [
        -1.0, -1.0,
        -1.0,  1.0,
         1.0,  1.0,
         1.0, -1.0,
        -1.0, -1.0,
    ];
    var vbo = createStaticFloatVbo(gl, vertices, 2, 5);
    return {
        bind: vbo.bind,
        drawFill: function () { gl.drawArrays(gl.TRIANGLE_FAN, 0, 4); },
        drawOutline: function() { gl.drawArrays(gl.LINE_STRIP, 0, 5); }
    };
};

function createCircleVbo(gl, numEdges) {
    // start with center vertex, used by triangle fan
    var vertices = [0.0, 0.0];
    // add edge vertices
    var step = 2.0 * Math.PI / numEdges;
    for (var i = 0; i <numEdges; i++) {
        var angle = step * i;
        vertices[i*2 + 2] = Math.cos(angle);
        vertices[i*2 + 3] = Math.sin(angle);
    }
    // duplicate first edge vertex, needed both by triangle fan and
    // LINE_STRIP (LINE_LOOP workaround).
    vertices[numEdges*2 + 2] = vertices[2];
    vertices[numEdges*2 + 3] = vertices[3];

    var vbo = createStaticFloatVbo(gl, vertices, 2, numEdges + 2);
    return {
        bind: vbo.bind,
        drawFill: function() { gl.drawArrays(gl.TRIANGLE_FAN, 0, numEdges + 2); },
        drawOutline: function() { gl.drawArrays(gl.LINE_STRIP, 1, numEdges + 1); },
        destroy: function() {
            try {
                gl.deleteBuffer(vbo);
            }
            catch (e) {
                // get a TypeError here in Chrome, hopefully the buffer will be
                // destroyed by garbage collection
            }
        }
    };
};
