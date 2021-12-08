// 在此处添加您的代码
/**
 * Control and get feedback via serial with a HMI screen (Serial Screen)
 */
//% color=#E3338C weight=96 icon="\uf011
namespace hmi {

    let rxIndex = 0
    let rxV = 0
    let rxBuffer: Buffer = null
    let rxCmd = [0]
    let index = 0
    let temp2 = 0
    let temp = 0
    let cmdTouchY = 0
    let cmdTouchX = 0
    let sendCmdLastMs = 0
    let sCmd = ""
    sCmd = ""

    /**
     * sendCommendShowPic
     */
    //% help=hmi/sendCommendShowPic
    //% blockId=sendCommendShowPic block="sendCommendShowPic" blockGap=16
    //% useLoc="radio.sendCommendShowPic" draggableParameters=reporter
    function sendCommendShowPic(picID: number) {
        toHexString(picID)
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
    function sendCommend(sCmd: string) {
        sCmd = "AA" + sCmd + "CC33C33C"
        serial.writeBuffer(Buffer.fromHex(sCmd))
        sendCmdLastMs = control.millis()
    }

    /**
     * sendCommendShowPic
     */
    //% help=hmi/receivedCommand
    //% blockId=receivedCommand block="receivedCommand" blockGap=16
    //% useLoc="radio.receivedCommand" draggableParameters=reporter
    function receivedCommand(listCommand: any[]) {
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
    
    function toHexString(number: number) {
        temp = Math.trunc(number)
        sCmd = ""
        while (temp >= 1) {
            temp2 = temp % 16
            if (temp2 < 10) {
                sCmd = "" + convertToText(temp2) + sCmd
            } else {
                sCmd = "" + String.fromCharCode(temp2 + 55) + sCmd
            }
            temp = Math.trunc(temp / 16)
        }
    }

}