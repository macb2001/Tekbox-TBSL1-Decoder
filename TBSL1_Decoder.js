/*
 *	TTN Uplink Payload Decoder for Tekbox TBSL1
 *	Author: Mackenzie Broughton
 *	Email: mackenzie.broughton@agr.gc.ca
 *	Date: May 18, 2023
 */

function decodeUplink(input) {
	const decoded = {};
	const warnings = [];
	const payload = String.fromCharCode(...new Uint8Array(input.bytes));
	decoded.rawPayload = payload;
	decoded.fPort = input.fPort;

	const messageType = payload[0];
	if (messageType === "C") {
		decoded.messageType = "Node Report";
		decoded.timestamp = payload.substring(1, 18);
		decoded.deviceID = payload.substring(18, 26);
		decoded.firmwareVersion = payload.substring(26, 34);

		const powerSupplyID = payload[34];
		switch (powerSupplyID) {
			case "0":
				decoded.powerSupplyID = "Solar/USB LiPo";
				break;
			case "1":
				decoded.powerSupplyID = "Solar/USB NiMh";
				break;
			case "2":
				decoded.powerSupplyID = "External";
				break;
			case "3":
				decoded.powerSupplyID = "Internal";
				break;
			default:
				warnings.push("powerSupplyID Unknown");
				break;
		}

		decoded.sensorID = payload[35];

		const boardStatus = payload[36];
		if (boardStatus === "R") {
			decoded.boardStatus = "Running";
		} else if (boardStatus === "S") {
			decoded.boardStatus = "Startup";
		} else {
			warnings.push("boardStatus Unknown");
		}

		decoded.RSSI = parseInt(payload.substring(38));
	} else if (messageType === "P") {
		decoded.messageType = "Sensor Report";
		decoded.timestamp = payload.substring(2, 19);

		const sensorType = payload[1];
		switch (sensorType) {
			case "S":
				decoded.sensorType = "SDI-12";
				decoded.ordinal = payload[20];
				decoded.numOfParams = parseInt(payload.substring(21, 23));
				const params = payload.substring(24).split(" ");
				for (let i = 0; i < params.length; i++) {
					decoded[`param${i}`] = parseFloat(params[i]);
				}
				break;
			case "P":
				decoded.sensorType = "Pulse Counter";
				const subSensorID = payload[20];
				if (subSensorID === "0") {
					decoded.subSensorID = "Rain Gauge";
				} else if (subSensorID === "1") {
					decoded.subSensorID = "Flow Meter";
				} else {
					warnings.push("subSensorID_Analog Unknown");
				}
				decoded.numOfParams = parseInt(payload[21]);
				decoded.param1 = parseInt(payload.substring(23, 31), 16);
				decoded.param2 = parseFloat(payload.substring(32)).toFixed(5);
				break;
			case "A":
				decoded.sensorType = "Analog";
				decoded.subSensorID = payload[20];
				decoded.numOfParams = parseInt(payload[21]);
				decoded.minParam = parseFloat(payload.substring(23, 28));
				decoded.avgParam = parseFloat(payload.substring(29, 34));
				decoded.maxParam = parseFloat(payload.substring(35));
				break;
			case "E":
				decoded.sensorType = "External Voltage Supply";
				break;
			case "B":
				decoded.sensorType = "Battery Voltage";
				decoded.batteryVolt = parseFloat(payload.substring(20, 24));
				break;
			case "R":
				decoded.sensorType = "RSSI";
				break;
			default:
				warnings.push("sensorType Unknown");
				break;
		}

		if (sensorType === "S" || sensorType === "P" || sensorType === "A") {
			decoded.sensorID = payload[19];
		}
	} else {
		warnings.push("messageType Unknown");
	}

	return {
		data: decoded,
		warnings: warnings
	};
}
