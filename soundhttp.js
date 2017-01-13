/**
 * Created by Administrator on 2017/1/12.
 */
(function () {
    //语音数据包--2秒
    var proto = window.soundhttp = {};
    var context = new (window.AudioContext || window.webkitAudioContext)();
    proto.getData=function(url) {
        var request = new XMLHttpRequest();
        request.open('GET', url, true);
        request.responseType = 'arraybuffer';
        request.onload = function(){
            var audioData = request.response;
            context.decodeAudioData(audioData, function(buffer){
                    var left = buffer.getChannelData(0);
                    var bag = proto.splitbytr(left);
                    alert('stop');
                    proto.sendbag(bag,proto.sendback,proto.oversend);
                },
                function(e){"Error with decoding audio data" + e.err});
        }
        request.send();
    }
    proto.sendback=function(e){};
    proto.playback = function (e) {return true};
    proto.oversend = function (e) {}
    proto.splitbytr=function(source){
        var len = context.sampleRate*2;
        var index  =0;
        var bags =[];
        while (index<source.length){
            if (index + len > source.length){
                bags.push(source.subarray(index, source.length));
                break;
            } else{
                bags.push(source.subarray(index, index + len));
                index += len;
            }
        }
        return bags;
    }

    proto.sendbag=function (bags,back,endback){
        var id = setInterval(function (){
            var p = bags.shift();
            if(p){
                if(back)back(p);
            }else{
                if (endback) endback('over');
                clearInterval(id);
            }
        },500)
    }

    proto.buildSound=function(param){
        var float = param.byte;
        var frameCount = param.len;
        if(frameCount<=0) return console.log('数据长度 0');
        var myArrayBuffer = context.createBuffer(2, frameCount, context.sampleRate);
        var nowBuffering = myArrayBuffer.getChannelData(0);

        for (var i = 0; i <frameCount; i++) {
            nowBuffering[i] = float[i];
        }

        var anotherArray = new Float32Array;
        myArrayBuffer.copyFromChannel(anotherArray,0,0);
        myArrayBuffer.copyToChannel (anotherArray,1,0);

        return myArrayBuffer;
    }
    var soundbags =[];
    var play = false;
    var cachetime = 6;
    var goon = false;
    proto.playSound=function (buffer){
        soundbags.push(buffer);
        if(!play && soundbags.length>cachetime ||goon){
            play = true;
            loopsound();
        }
    }
    proto.playend=function () {
        goon = true;
        if(!play){
            play = true;
            loopsound();
        }
    }

    function loopsound(){
        var p = soundbags.shift();
        if(p){
            console.log('play');
            var source = context.createBufferSource();
            source.connect(context.destination);
            source.buffer = p;
            source.start();
            source.onended = function () {
                console.log('end');
                loopsound();
            }
        }else{
            play = false;
            console.log('over')
        }
    }

    function soundRead(stream,bufferSize,callback){
        bufferSize=bufferSize||1024;
        var scriptprocessor;
        if (context.createJavaScriptNode) {
            scriptprocessor = context.createJavaScriptNode(bufferSize, 2, 2);
        } else if (context.createScriptProcessor) {
            scriptprocessor = context.createScriptProcessor(bufferSize, 2, 2);
        } else {
            throw 'WebAudio API has no support on this browser.';
        }
        var volume = context.createGain();
        var audioInput = context.createMediaStreamSource(stream);
        audioInput.connect(volume);
        volume.connect(scriptprocessor);
        scriptprocessor.connect(context.destination);
        scriptprocessor.onaudioprocess = function (event) {
            var left = event.inputBuffer.getChannelData(0);
            //var right = e.inputBuffer.getChannelData(1);
            if(callback)callback(left);
        }
    }
})();
