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
        switch(type){
            case DeviceType.ta:
                sCmdPrefix = "AA"
                sCmdPostfix = "CC33C33C"
            case DeviceType.ta:
                sCmdPrefix = "5AA5"
                sCmdPostfix = ""
        }
        // Max=254
        serial.setRxBufferSize(254)
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
     * Send Command in HEX string, w/o space
     */
    //% help=hmi/sendCommand
    //% blockId=sendCommand block="Send Command %sCmd" blockGap=16
    //% useLoc="hmi.sendCommand" draggableParameters=reporter
    export function sendCommand(sCmd: string) {
        sCmd = sCmd.replaceAll(" ", "") + sCmdPostfix
        if(deviceType==DeviceType.dgus)
            sCmd = toHexString(sCmd.length/2)+sCmd
        sCmd = sCmdPrefix+sCmd
        serial.writeBuffer(Buffer.fromHex(sCmd))
    }

    /**
     * Send show image command with image ID，which prestored in your HMI screen
     */
    //% help=hmi/sendCommandShowPic
    //% blockId=sendCommandShowPic block="Show Image ID=%picID" blockGap=16
    //% useLoc="hmi.sendCommandShowPic" draggableParameters=reporter
    export function sendCommandShowPic(picID: number) {
        switch(deviceType){
            case DeviceType.ta:
                sendCommand("70" + toHexString(picID))
            case DeviceType.dgus:
                sendCommand("8003" + toHexString(picID,4))
        }
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
    export function onTouch(handler:(x: number, y: number)=>void):void{
        onTouchHandler=handler
    }

    let onReceivedHandler : (list: number[])=>void

    /**
     * On Received Unknown Msg
     */
    //% help=hmi/receivedCommand
    //% blockId=onReceivedUnknownMsg block="onReceivedUnknownMsg" blockGap=16
    //% weight=50
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

    basic.forever( function() {
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
    })

}