/* @Author: www.dingtek.com
 * @Date: 2021-12-14 14:08:59
 * @LastEditors: CNDINGTEK
 * @LastEditTime: 2022-08-18 15:37:16
 * @Description: Demo code for waste bin level sensor DF701/703 TCP Socket upload message parsing. Not including downlink command.
 */
//While integration with user system, please remark below.
//let payload = [0x80,0x00,0x01,0x02,0x1E,0x06,0x49,0x00,0x1B,0x00,0x00,0x01,0x01,0x01,0x5F,0x00,0x80,0x54,0xC4,0x00,0x01,0x18,0x68,0x82,0x10,0x43,0x03,0x88,0x76,0x81];
/************************************************************************************
 * 
 * Below are functions for codec which should put into user code.
 *   
 * *********************************************************************************/
let metadata = { "Integration Name": "TCP Binary Integration" };
var result = "";

switch (parseInt(payload[2]).toString(16)) {
    case '1':        
        result = Parse_Code_DF70X(payload, metadata);

    default:
        result = Parse_Code_Other(payload, metadata);
        break;
}

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
function Parse_Code_DF70X(payload_in, metadata_in) {
    var res = null;
    //return payload_in[3].toString(16); 
    console.log(payload_in[3].toString(16));
    switch (payload_in[3].toString(16)) {
        case '1':            
        case '2':
            //return payload_in.length;
            
            if (payload_in.length >= parseInt(payload_in[4])) {
                var deviceName = "";
                for (var i = 0; i < 8; i++) {
                    deviceName += LeftPadZero(parseInt(payload_in[21 + i]).toString(16), 2);
                }
                if (parseInt(payload_in[7])) {//with gps info
                    res = {
                        deviceName: deviceName.substring(1, 16),
                        deviceType: "DF70X_TCP",
                        attributes: {},
                        telemetry: {
                            air_height: parseInt(payload_in[5] * 256 + payload_in[6]),
                            volt: parseInt(payload_in[21] * 256 + payload_in[22]),
                            temperature: parseInt(payload_in[16]),
                            longitude: HexArrayToFloat(payload_in.slice(8, 12)),
                            latitude: HexArrayToFloat(payload_in.slice(12, 16)),
                            tilt_angle: parseInt(payload_in[18]),
                            alarm_full: parseInt(payload_in[19]) >> 4,
                            alarm_fire: parseInt(payload_in[19]) % 16,
                            alarm_fall: parseInt(payload_in[20]) >> 4,
                            alarm_battery: parseInt(payload_in[20]) % 16,
                            rsrp: HexArrayToFloat(payload_in.slice(23, 27)),
                            frame_counter: parseInt(payload_in[27] * 256 + payload_in[28]),
                        }
                    };
                } else {//without gps
                    res = {
                        deviceName: deviceName.substring(1, 16),
                        deviceType: "DF70X_TCP",
                        attributes: {},
                        telemetry: {
                            air_height: parseInt(payload_in[5] * 256 + payload_in[6]),
                            volt: parseInt(payload_in[13] * 256 + payload_in[14]),
                            temperature: parseInt(payload_in[8]),
                            tilt_angle: parseInt(payload_in[10]),
                            alarm_full: parseInt(payload_in[11]) >> 4,
                            alarm_fire: parseInt(payload_in[11]) % 16,
                            alarm_fall: parseInt(payload_in[12]) >> 4,
                            alarm_battery: parseInt(payload_in[12]) % 16,
                            rsrp: HexArrayToFloat(payload_in.slice(15, 19)),
                            frame_counter: parseInt(payload_in[19] * 256 + payload_in[20]),
                        }
                    };
                }
            }
            break;
        case '3':
            if (payload_in.length >= parseInt(payload_in[4])) {
                var p_len = parseInt(payload_in[4]);
                var deviceName = "";
                for (var i = 0; i < 8; i++) {
                    deviceName += LeftPadZero(parseInt(payload_in[p_len - 9 + i]).toString(16), 2);
                }
                if (parseInt(payload_in[7])) {//with gps info
                    res = {
                        deviceName: deviceName.substring(1, 16),
                        deviceType: "DF70X_TCP",
                        attributes: {
                            work_mode: parseInt(payload_in[22]),
                            fall_enabled: parseInt(payload_in[20]),
                            threshold_full: parseInt(payload_in[9]),
                            threshold_fire: parseInt(payload_in[10]),
                            threshold_fall: parseInt(payload_in[11]),
                            interval_detection: parseInt(payload_in[8]),
                            interval_upload: parseInt(payload_in[7]),
                            version: parseInt(payload_in[5]).toString() + "." + parseInt(payload_in[6]).toString(),
                        }
                    };
                }
            }
            break;
        default:
            break;
    }
    console.log(res);
    return res;

}
//For other kinds products.
function Parse_Code_Other(payload, metadata) {
    return payload;
}
return result;