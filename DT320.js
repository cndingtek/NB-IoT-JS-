/* Discliam: This code is only for reference who use CNDINGTEK products. CNDINGTEK IS NOT responsible for any potential result from using
 * this code. CNDINGTEK does not promise to fix any bug in this code. 
 * @Author: www.dingte.com
 * @Date: 2021-12-14 14:08:59
 * @LastEditors: CNDINGTEK
 * @LastEditTime: 2022-08-18 15:37:16
 * @Description: Demo code for DT320 TCP Socket upload message parsing. Not including downlink command.
 */
//While integration with user system, please remark below.
let payload = [
    0x80, 0x00, 0x20, 0x03, 0x24, 0x01, 0x00, 0x00, 0x3C, 0x00, 0x1E, 0x00, 0x02, 0x00, 0x64, 0x01, 0x32, 0x64, 0x00, 0x00, 0x31, 0x32, 0x30, 0x2E, 0x39, 0x32, 0x2E, 0x38, 0x39, 0x2E, 0x31, 0x32, 0x32, 0x3B, 0x23, 0x82, 0x3B, 0x18, 0x65, 0x38, 0x50, 0x60, 0x02, 0x98, 0x72, 0x81
];
//While integration with user system, please remark below.
let metadata = { "Integration Name": "TCP Binary Integration" };
var result = "";

switch (parseInt(payload[2]).toString(16)) {
    case '01':
    case '20':
        result = Parse_Code_DT320(payload, metadata);

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

function Parse_Code_DT320(payload_in, metadata_in) {
    var res = null;
    switch (payload_in[3].toString(16)) {
        case '1':
        case '2':
            //return payload_in.length;

            if (payload_in.length >= parseInt(payload_in[4])) {
                var deviceName = "";
                var temp = 0.0;
                for (var i = 0; i < 8; i++) {
                    deviceName += LeftPadZero(parseInt(payload_in[23 + i]).toString(16), 2);
                }
                temp = parseFloat(payload_in[8].toString(16) + "." + payload_in[19].toString(16));
                if (payload_in[7] == 0x01) temp = -temp;
                res = {
                    deviceName: deviceName.substring(1, 16),
                    deviceType: "DT32X_TCP",
                    attributes: {},
                    telemetry: {
                        air_quality: parseInt(payload_in[5] * 256 + payload_in[6]),
                        temperature: temp,
                        humidity: parseFloat(payload_in[10].toString(16) + "." + payload_in[11].toString(16)),
                        volt: parseInt(payload_in[15] * 256 + payload_in[16]),
                        alarm_air_quality: parseInt(payload_in[12]) >> 4,
                        alarm_high_temperature: parseInt(payload_in[12]) & 0x0F,
                        alarm_low_temperature: parseInt(payload_in[13]) >> 4,
                        alarm_high_humidity: parseInt(payload_in[13]) & 0x0F,
                        alarm_low_humidity: parseInt(payload_in[14]) >> 4,
                        alarm_battery: parseInt(payload_in[14]) & 0x0F,
                        rsrp: HexArrayToFloat(payload_in.slice(17, 21)),
                        frame_counter: parseInt(payload_in[21] * 256 + payload_in[22]),
                    }
                };


            }

            break;
        case '3':
            if (payload_in.length >= parseInt(payload_in[4])) {
                var p_len = parseInt(payload_in[4]);
                var deviceName = "";
                var high_temp = 0;
                var low_temp = 0;
                high_temp = parseInt(payload_in[14]);
                if (payload_in[13] == 0x01) high_temp = -high_temp;
                low_temp = parseInt(payload_in[16]);
                if (payload_in[15] == 0x01) low_temp = -low_temp;
                for (var i = 0; i < 8; i++) {
                    deviceName += LeftPadZero(parseInt(payload_in[payload_in.length - 9 + i]).toString(16), 2);
                }
                //console.log(deviceName);
                res = {
                    deviceName: deviceName.substring(1, 16),
                    deviceType: "DT32X_TCP",
                    attributes: {
                        air_quality_threshold: parseInt(payload_in[11] * 256 + payload_in[12]),
                        threshold_high_temperature: high_temp,
                        threshold_low_temperature: low_temp,
                        threshold_high_humidity: parseInt(payload_in[17]),
                        threshold_low_humidity: parseInt(payload_in[18]),
                        interval_detection: parseInt(payload_in[9] * 256 + payload_in[10]),
                        interval_upload: parseInt(payload_in[7] * 256 + payload_in[8]),
                        version: parseInt(payload_in[5]).toString() + "." + parseInt(payload_in[6]).toString(),
                    }
                };
                //console.log(res.attributes.threshold_low_humidity);
            }

            break;
        default:
            break;
    }
    //console.log(res);
    return res;
}
//For other kinds products.
function Parse_Code_Other(payload, metadata) {
    return payload;
}
return result;