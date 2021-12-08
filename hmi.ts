// 在此处添加您的代码
/**
 * Control and get feedback via serial with a HMI screen (Serial Screen)
 */
//% color=#E3338C weight=96 icon="\uf011
namespace hmi {


    /**
     * sendCommendShowPic
     */
    //% help=hmi/sendCommendShowPic
    //% blockId=sendCommendShowPic block="sendCommendShowPic" blockGap=16
    //% useLoc="radio.sendCommendShowPic" draggableParameters=reporter
    export function sendCommendShowPic(picID: number) {
        let sCmd = toHexString(picID)
        if (sCmd.length == 1) {
            sCmd = "0" + sCmd
        }
        sendCommend("70" + sCmd)
    }

    /**
     * sendCommendShowPic
     */
    //% help=hmi/sendCommend
    //% blockId=sendCommend block="sendCommend" blockGap=16
    //% useLoc="radio.sendCommend" draggableParameters=reporter
    export function sendCommend(sCmd: string) {
        sCmd = "AA" + sCmd + "CC33C33C"
        serial.writeBuffer(Buffer.fromHex(sCmd))
    }

    /**
     * sendCommendShowPic
     */
    //% help=hmi/receivedCommand
    //% blockId=receivedCommand block="receivedCommand" blockGap=16
    //% useLoc="radio.receivedCommand" draggableParameters=reporter
    export function receivedCommand(listCommand: any[]) {
        let cmdTouchY = 0
        let cmdTouchX = 0
        if (listCommand.length != 5) {
            basic.showIcon(IconNames.No)
        } else if (listCommand[0] == 115 || listCommand[0] == 114) {
            led.unplot(Math.map(cmdTouchX, 0, 640, 0, 5), Math.map(cmdTouchY, 0, 480, 0, 5))
            cmdTouchX = listCommand[1] * 256 + listCommand[2]
            cmdTouchY = listCommand[3] * 256 + listCommand[4]
            led.plot(Math.map(cmdTouchX, 0, 640, 0, 5), Math.map(cmdTouchY, 0, 480, 0, 5))
            sendCommendShowPic(Math.map(cmdTouchX, 0, 640, 1, 60))
        } else {
            basic.showIcon(IconNames.Surprised)
        }
    }
    
    function toHexString(number: number):string {
        let temp2 = 0
        let temp = 0
        let sCmd = ""
        temp = Math.trunc(number)
        while (temp >= 1) {
            temp2 = temp % 16
            if (temp2 < 10) {
                sCmd = "" + convertToText(temp2) + sCmd
            } else {
                sCmd = "" + String.fromCharCode(temp2 + 55) + sCmd
            }
            temp = Math.trunc(temp / 16)
        }
        return sCmd
    }

    function receiving() {
        let rxIndex = 0
        let rxV = 0
        let rxBuffer: Buffer = null
        let rxCmd = [0]

        rxBuffer = serial.readBuffer(1)
        rxV = rxBuffer[0]
        if (rxV == 170 && rxIndex == 0) {
            rxIndex = 1
            rxCmd = []
        } else if (rxV == 204 && rxIndex == 1) {
            rxIndex = 2
        } else if (rxV == 51 && rxIndex == 2) {
            rxIndex = 3
        } else if (rxV == 195 && rxIndex == 3) {
            rxIndex = 4
        } else if (rxV == 60 && rxIndex == 4) {
            rxIndex = 0
            receivedCommand(rxCmd)
        } else {
            rxCmd.push(rxV)
        }
    }

}