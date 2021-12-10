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
    //% block=8x16 
    fs16,
    //% block=16x32
    fs32,
    //% block=6x12
    fs12,
    //% block=12x24
    fs24,
}

enum FontSizeUnicode {
    //% block=16x16 
    fs16,
    //% block=24x24
    fs24,
    //% block=32x32
    fs32,
}


declare namespace hmi {}

/**
 * Control and get feedback via serial with a HMI screen (Serial Screen)
 */
//% color=#23738C weight=96 icon="\uf03e"
namespace hmi { //f011
    let deviceType=DeviceType.ta
    let sCmdPrefix = "AA"
    let sCmdPostfix ="CC33C33C"
    let bCmdPrefix = Buffer.fromHex("AA")
    let bCmdPostfix = Buffer.fromHex("CC33C33C")

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
                bCmdPrefix = Buffer.fromHex("AA")
                bCmdPostfix = Buffer.fromHex("CC33C33C")
                receiveMsg = receiveMsg_Ta
                break
            case DeviceType.dgus:
                sCmdPrefix = "5AA5"
                sCmdPostfix = ""
                bCmdPrefix = Buffer.fromHex("5AA500") //3rd byte for length
                bCmdPostfix = Buffer.fromHex("")
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
     * Show Text command with extend font (0x98)
     */
    //% help=hmi/sendCommandShowTextEx
    //% blockId=sendCommandShowTextEx block="Show Text (extend font) %text |size %fs at x%x y%y color%color bgcolor%bgcolor" blockGap=16
    //% useLoc="hmi.sendCommandShowTextEx" draggableParameters=reporter
    //% weight=80
    export function sendCommandShowTextUnicode(text: string, fs: FontSizeUnicode, x: number = 0, y: number = 0, color: number, bgcolor: number) {
        let bCmd,bText, iText1st
        switch (deviceType) {
            case DeviceType.ta:
                bCmd = Buffer.create(12+text.length*2)
                bCmd.setUint8(0, 0x98)
                bCmd.setNumber(NumberFormat.UInt16BE, 1, x)
                bCmd.setNumber(NumberFormat.UInt16BE, 3, y)
                bCmd.setNumber(NumberFormat.UInt8LE, 5, [0x26,0x28,0x2B].get(fs))  //font ID,Unicode 16x16, need transfer into Screen in advance
                bCmd.setNumber(NumberFormat.UInt8LE, 6, 0x05|(color>=0?0x80:0)|(bgcolor>=0?0x40:0))  //C_Mode, draw front/bg color; unicode
                bCmd.setNumber(NumberFormat.UInt8LE, 7, [0x0A,0x0B,0x0C].get(fs))  //16x16
                bCmd.setNumber(NumberFormat.UInt16BE, 8, color)
                bCmd.setNumber(NumberFormat.UInt16BE, 10, bgcolor)
                iText1st = 12
                break
            case DeviceType.dgus:  //todo
                bCmd = Buffer.create(5 + text.length)
                bCmd.setUint8(0, 0x98)  //to be corrected
                break
        }
        for (let i = 0; i < text.length; i++) {
            bCmd.setNumber(NumberFormat.UInt16BE, iText1st + i*2, text.charCodeAt(i))
        }
        sendCommandBuffer(bCmd)
    }

    /**
     * Show Text, ASCII only
     * (command: 0x53, 0x54, 0x55, 0x6e, 0x6f)
     */
    //% help=hmi/sendCommandShowText
    //% blockId=sendCommandShowText block="Show Text %text |size %fs ||at x%x y%y" blockGap=16
    //% useLoc="hmi.sendCommandShowText" draggableParameters=reporter
    //% weight=80
    export function sendCommandShowText(text: string, fs: FontSize, x: number = 0, y: number = 0) {
        let bCmd
        switch (deviceType) {
            case DeviceType.ta:
                bCmd=Buffer.create(5+text.length)
                bCmd.setUint8(0, [0x53, 0x54, 0x55, 0x6e, 0x6f].get(fs))
                bCmd.setNumber(NumberFormat.UInt16BE, 1, x)
                bCmd.setNumber(NumberFormat.UInt16BE, 3, y)
                for (let i = 0; i < text.length; i++) {
                    bCmd.setNumber(NumberFormat.UInt8LE, 5+i, text.charCodeAt(i))
                }
                break
            case DeviceType.dgus: //todo
                bCmd = Buffer.create(5 + text.length)
                bCmd.setUint8(0,0x53)  //to be corrected
                break
        }
        sendCommandBuffer(bCmd)
    }

    function sendCommandBuffer(bCmd: Buffer) {
        if (deviceType == DeviceType.dgus) //insert length byte
            bCmdPrefix.setUint8(2, bCmd.length / 2)
        let b = Buffer.concat([bCmdPrefix,bCmd,bCmdPostfix])
        console.debug("Debug=="+b.toHex()+"==Debug")
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
                sendCommandBuffer(Buffer.fromArray([0x70, picID]))
                break
            case DeviceType.dgus:
                sendCommandBuffer(Buffer.fromArray([0x80, 0x03, picID / 256, picID % 256]))
                break
        }
    }

    /**
     * Send Command in HEX string (without command prefix/postfix)
     *  w/o space
     */
    //% help=hmi/sendCommand
    //% blockId=sendCommand block="Send General Command %sCmd" blockGap=16
    //% useLoc="hmi.sendCommand" draggableParameters=reporter
    //% weight=50
    export function sendCommand(sCmd: string) {
        sCmd = sCmd.replaceAll(" ", "")
        sCmd = sCmd.replaceAll("0x", "")
        sCmd = sCmd.replaceAll("0X", "")
        sCmd = sCmd.replaceAll(",", "")
        if(deviceType==DeviceType.dgus)
            bCmdPostfix.setUint8(2,sCmd.length/2)
        serial.writeBuffer(Buffer.concat([bCmdPrefix, Buffer.fromHex(sCmd),bCmdPostfix]))
        console.debug("sendCommand:"+sCmd)
    }

    /**
     * Output console log info to HMI
     */
    //% help=hmi/logToHMI
    //% blockId=logToHMI block="Output console log info to HMI which level high than %level" blockGap=16
    //% useLoc="hmi.logToHMI" draggableParameters=reporter
    //% weight=50
    export function logToHMI(level: ConsolePriority) {
        console.minPriority=level
        console.addListener(function (priority: ConsolePriority, text: string) {
            let bCmd
            if (deviceType == DeviceType.ta) {
                bCmd = Buffer.fromHex("AA5400000140")
            }else 
            if (deviceType == DeviceType.dgus) { // todo
                bCmd = Buffer.fromHex("5AA55400000140")
                bCmd.setUint8(3, bCmd.length / 2)// length byte
            }
            //let b = bCmdPrefix.concat(bCmd).concat(Buffer.fromUTF8(text)).concat(bCmdPostfix)
            serial.writeBuffer(Buffer.concat([bCmdPrefix, bCmd, Buffer.fromUTF8(text), bCmdPostfix]))
        })
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
        console.debug("rx:"+rxV.toString())
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
        console.debug("rx:" + rxV.toString())
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