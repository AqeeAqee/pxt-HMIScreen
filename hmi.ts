// 在此处添加您的代码
enum DeviceType{
    //% block=TA/HMI
    ta,
    //% block=DGUS
    dgus,
}


declare namespace hmi {}

/**
 * Control and get feedback via serial with a HMI screen (Serial Screen)
 */
//% color=#23738C weight=96 icon="\uf03e"
namespace hmi { //f011
    let sCmdPrefix = "AA"
    let sCmdPostfix ="CC33C33C"
    let deviceType=DeviceType.ta

    /**
     * Init with screen type, TA or DGUS command mode. And will set Rx Buffer Size to Max (254)
     * TA: AA ... CC33C33C
     * DGUS: 5AA5 ... 
     */
    //% help=hmi/init
    //% blockId=hmi_init block="Use HMI Screen in %type mode" blockGap=16 
    //% weight=100
    //% useLoc="hmi.init" draggableParameters=reporter
    export function init(type:DeviceType):void{
        deviceType=type
        let receiveMsg:Action
        switch(type){
            case DeviceType.ta:
                sCmdPrefix = "AA"
                sCmdPostfix = "CC33C33C"
                receiveMsg = receiveMsg_Ta
            case DeviceType.ta:
                sCmdPrefix = "5AA5"
                sCmdPostfix = ""
                receiveMsg = receiveMsg_DGUS
        }
        // Max=254
        serial.setRxBufferSize(254)
        loops.everyInterval(20, receiveMsg)
    }

    /**
     * sendCommandHello
     */
    //% help=hmi/sendCommandHello
    //% blockId=sendCommandHello block="sendCommandHello" blockGap=16
    //% weight=95
    //% useLoc="hmi.sendCommandHello" draggableParameters=reporter
    export function sendCommandHello():void {
        sendCommand("00")
    }

    /**
     * Send show image command with image ID，which prestored in your HMI screen
     */
    //% help=hmi/sendCommandShowPic
    //% blockId=sendCommandShowPic block="Show Image ID=%picID" blockGap=16
    //% useLoc="hmi.sendCommandShowPic" draggableParameters=reporter
    //% weight=80
    export function sendCommandShowPic(picID: number) {
        switch(deviceType){
            case DeviceType.ta:
                sendCommand("70" + toHexString(picID))
            case DeviceType.dgus:
                sendCommand("8003" + toHexString(picID,4))
        }
    }

    /**
     * Send Command in HEX string, w/o space
     */
    //% help=hmi/sendCommand
    //% blockId=sendCommand block="Send General Command %sCmd" blockGap=16
    //% useLoc="hmi.sendCommand" draggableParameters=reporter
    //% weight=50
    export function sendCommand(sCmd: string) {
        sCmd = sCmd.replaceAll(" ", "") + sCmdPostfix
        if(deviceType==DeviceType.dgus)
            sCmd = toHexString(sCmd.length/2)+sCmd
        sCmd = sCmdPrefix+sCmd
        serial.writeBuffer(Buffer.fromHex(sCmd))
    }

    function toHexString(number: number, minByteLength:number =1):string {
        let temp2 = 0
        let temp = 0
        let sCmd = ""
        while (temp >= 1) {
            temp = Math.trunc(number)
            temp2 %= 16
            if (temp2 < 10) {
                sCmd = "" + convertToText(temp2) + sCmd
            } else {
                sCmd = "" + String.fromCharCode(temp2 + 55) + sCmd
            }
            temp /= 16
        }
        while (sCmd.length<minByteLength*2)
            sCmd = "0" + sCmd
        return sCmd
    }

    let onTouchHandler : (x:number, y:number)=>void


    /**
     * onTouch
     */
    //% help=hmi/onTouch
    //% blockId=onTouch block="onTouch" blockGap=16
    //% useLoc="hmi.onTouch" draggableParameters=reporter
    //% weight=49
    export function onTouch(handler:(x: number, y: number)=>void):void{
        onTouchHandler=handler
    }

    let onReceivedHandler : (list: number[])=>void

    /**
     * On Received Unknown Msg
     */
    //% help=hmi/receivedCommand
    //% blockId=onReceivedUnknownMsg block="On Received Unknown Msg" blockGap=16
    //% weight=20
    //% useLoc="hmi.onReceivedUnknownMsg" draggableParameters=reporter
    export function onReceivedUnknownMsg(handler: (list: number[]) => void):void{
        onReceivedHandler=handler
    }

    function receivedCommand(listCommand: number[]) {
        if (listCommand[0] == 115 || listCommand[0] == 114) {
            if(onTouchHandler)
                onTouchHandler(listCommand[1] * 256 + listCommand[2], listCommand[3] * 256 + listCommand[4])
        } else {
            if(onReceivedHandler)
                onReceivedHandler(listCommand)
        }
    }

    let rxIndex = 0
    let rxV = 0
    let rxLength = 0
    let rxCmd: number[] = []

    let receiveMsg_Ta: Action = function () {
        let rxIndex = 0
        let rxV = 0
        let rxCmd: number[] = []

        rxV = serial.readBuffer(1)[0]
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

    let receiveMsg_DGUS: Action = function () {

        rxV = serial.readBuffer(1)[0]
        if (rxV == 0x5A && rxIndex == 0) {
            rxIndex = 1
        } else if (rxV == 0xA5 && rxIndex == 1) {
            rxIndex = 2
        } else if (rxIndex == 2) {
            rxLength=rxV
            rxCmd = []
            rxIndex = 3
        } else if (rxIndex == 3) {
            if (rxCmd.length < rxLength)
                rxCmd.push(rxV)
            else
                rxIndex = 0
                receivedCommand(rxCmd)
        }
    }

}