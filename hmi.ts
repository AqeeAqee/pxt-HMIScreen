// 在此处添加您的代码
enum DeviceType{
    //% block=TA/HMI
    ta,
    //% block=DGUS
    dgus,
}
enum FontSize {
    //% block=8x8 ASCII
    fs8,
    //% block=16x16 
    fs16,
    //% block=32x32 GB2312
    fs32,
    //% block=12x12 GBK
    fs12,
    //% block=24x24 GB2312
    fs24,
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
                break
            case DeviceType.dgus:
                sCmdPrefix = "5AA5"
                sCmdPostfix = ""
                receiveMsg = receiveMsg_DGUS
                break
        }
        // Max=254
        serial.setRxBufferSize(254)
        control.inBackground(function(){basic.forever( receiveMsg)})
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
     * Show Text command 
     */
    //% help=hmi/sendCommandShowText
    //% blockId=sendCommandShowText block="Show Text %text |size %fs ||at x%x y%y" blockGap=16
    //% useLoc="hmi.sendCommandShowText" draggableParameters=reporter
    //% weight=80
    export function sendCommandShowText(text: string, fs: FontSize, x: number = 0, y: number = 0) {
        let lCmd
        switch (deviceType) {
            case DeviceType.ta:
                lCmd = [[0x53, 0x54, 0x55, 0x6e, 0x6f].get(fs)]
                break
            case DeviceType.dgus:
                lCmd = [0x53]  //to be corrected
                break
        }
        lCmd.push(Math.idiv(x, 256))
        lCmd.push(Math.trunc(x % 256))
        lCmd.push(Math.idiv(y, 256))
        lCmd.push(Math.trunc(y % 256))
        for (let i = 0; i < text.length; i++) {
            lCmd.push(text.charCodeAt(i))
        }
        sendCommandList(lCmd)
    }

    function sendCommandList(lCmd: number[]) {
        if (deviceType == DeviceType.dgus)
            lCmd.insertAt(0, lCmd.length / 2) 
        let b = Buffer.fromHex(sCmdPrefix).concat(Buffer.fromArray(lCmd)).concat(Buffer.fromHex(sCmdPostfix))
        console.debug(b.toHex())
        serial.writeBuffer(b)
    }


    /**
     * Send show image command with image ID，which prestored in your HMI screen
     */
    //% help=hmi/sendCommandShowPic
    //% blockId=sendCommandShowPic block="Show Image ID=%picID" blockGap=16
    //% useLoc="hmi.sendCommandShowPic" draggableParameters=reporter
    //% weight=80
    export function sendCommandShowPic(picID: number) {
        switch (deviceType) {
            case DeviceType.ta:
                sendCommand("70" + toHexString(picID))
                break
            case DeviceType.dgus:
                sendCommand("8003" + toHexString(picID, 2))
                break
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
        let b:Buffer
        
    }

    function toHexString(number: number, minByteLength:number =1):string {
        let sCmd = ""
        let temp = Math.trunc(number)
        let temp2 = 0
        while (temp >= 1) {
            temp2 = temp % 16
            if (temp2 < 10) {
                sCmd = "" + convertToText(temp2) + sCmd
            } else {
                sCmd = "" + String.fromCharCode(temp2 + 55) + sCmd
            }
            temp = Math.trunc(temp/16)
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