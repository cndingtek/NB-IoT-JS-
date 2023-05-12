/* @Author: www.dingtek.com
 * @Date: 2021-12-14 14:08:59
 * @LastEditors: CNDINGTEK
 * @LastEditTime: 2023-05-12 
 * @Description: Demo code for ultrasonic level sensor DF555 TCP Socket upload message parsing. Not including downlink command.
 */
//While integration with user system, please remark below.
//let payload = [0x80,0x00,0x05,0x03,0x20,0x04,0x05,0x00,0x1E,0x0A,0x1E,0x4B,0x1E,0x14,0x14,0x60,0x08,0x19,0x59,0x50,0x49,0x73,0x00,0x18,0x65,0x38,0x50,0x60,0x03,0x44,0x84,0x81,0xFF,0xFF,0xFF,0xFF,0xFF];
/************************************************************************************
 * 
 * Below are functions for codec which should put into user code.
 *   
 * *********************************************************************************/
let metadata = { "Integration Name": "TCP Binary Integration" };
var result = "";

switch (parseInt(payload[2]).toString(16)) {
    case '5':
        result = Parse_Code_DF555(payload, metadata);
        break;
    default:
        result = Parse_Code_Other(payload, metadata);
        break;
}
//console.log(result);
/** Helper functions **/

function decodeToString(payload) {
    return String.fromCharCode.apply(String, payload);
}

function decodeToJson(payload) {
    // covert payload to string.
    var str = decodeToString(payload);

    // parse string to JSON
    var data = JSON.parse(str);
    return data;
}
/**IEEE754 converting**/
function HexToFloat(t) {
    t = t.replace(/\s+/g, "");
    if (t == "") {
        return "";
    }
    if (t == "00000000") {
        return "0";
    }
    if ((t.length > 8) || (isNaN(parseInt(t, 16)))) {
        return "Error";
    }
    if (t.length < 8) {
        t = FillString(t, "0", 8, true);
    }
    t = parseInt(t, 16).toString(2);
    t = FillString(t, "0", 32, true);
    var s = t.substring(0, 1);
    var e = t.substring(1, 9);
    var m = t.substring(9);
    e = parseInt(e, 2) - 127;
    m = "1" + m;
    if (e >= 0) {
        m = m.substr(0, e + 1) + "." + m.substring(e + 1)
    } else {
        m = "0." + FillString(m, "0", m.length - e - 1, true)
    }
    if (m.indexOf(".") == -1) {
        m = m + ".0";
    }
    var a = m.split(".");
    var mi = parseInt(a[0], 2);
    var mf = 0;
    for (var i = 0; i < a[1].length; i++) {
        mf += parseFloat(a[1].charAt(i)) * Math.pow(2, -(i + 1));
    }
    m = parseInt(mi) + parseFloat(mf);
    if (s == 1) {
        m = 0 - m;
    }
    return m;
}

function FillString(t, c, n, b) {
    if ((t == "") || (c.length != 1) || (n <= t.length)) {
        return t;
    }
    var l = t.length;
    for (var i = 0; i < n - l; i++) {
        if (b == true) {
            t = c + t;
        }
        else {
            t += c;
        }
    }
    return t;
}
function LeftPadZero(in_data, in_len) {
    var data = in_data;
    if (data.length < in_len) {
        data = (Array(in_len).join(0) + data).slice(0 - in_len);
    }
    return data;
}
//Hex array  to float
function HexArrayToFloat(in_data) {
    var data = "";
    for (var i = 0; i < 4; i++) {
        data += LeftPadZero(in_data[3 - i].toString(16), 2)
    }
    return HexToFloat(data);
}
function Parse_Code_DF555(payload_in, metadata_in) {
    var res = null;
    //return payload_in[3].toString(16); 
    switch (payload_in[3].toString(16)) {
        case '1':
        case '2':
            //return payload_in.length;
            if (payload_in.length >= parseInt(payload_in[4])) {
                var deviceName = "";
                for (var i = 0; i < 8; i++) {
                    deviceName += LeftPadZero(parseInt(payload_in[21 + i]).toString(16), 2);
                }
                //console.log(deviceName);
                res = {
                    deviceName: deviceName.substring(1, 16),
                    deviceType: "DF555",
                    attributes: {
                        devEui: deviceName,
                        wireless: "NB-IoT",
                    },
                    telemetry: {
                        level: parseInt(payload_in[5] * 256 + payload_in[6]),
                        volt: parseInt(payload_in[13] * 256 + payload_in[14]),
                        temperature: parseInt(payload_in[8]),
                        alarmLevel: parseInt(payload_in[11]) >> 4,
                        alarmBattery: parseInt(payload_in[12]) & 0x0F,
                        rsrp: HexArrayToFloat(payload_in.slice(15, 19)),
                        frameCounter: parseInt(payload_in[19] * 256 + payload_in[20]),
                    }
                };


            }
            break;
        case '3':
            if (payload_in.length >= parseInt(payload_in[4])) {
                var p_len = parseInt(payload_in[4]);
                var deviceName = "";
                for (var i = 0; i < 8; i++) {
                    deviceName += LeftPadZero(parseInt(payload_in[p_len - 9 + i]).toString(16), 2);
                }
                var upload_time = parseInt(payload_in[7]);
                if (upload_time > 60) upload_time = upload_time - 60;
                res = {
                    deviceName: deviceName.substring(1, 16),
                    deviceType: "DF555",
                    attributes: {
                        levelThreshold: parseInt(payload_in[9]),
                        detectInterval: parseInt(payload_in[8]),
                        uploadInterval: upload_time,
                        firmware: parseInt(payload_in[5]).toString() + "." + parseInt(payload_in[6]).toString(),
                    }
                };

            }
            break;
        default:
            break;
    }
    return res;
}
//For other kinds products.
function Parse_Code_Other(payload, metadata) {
    return payload;
}

return result;