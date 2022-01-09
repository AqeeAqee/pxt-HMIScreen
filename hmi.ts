// 在此处添加您的代码
/**
 * todo:
 * clear screen
 * set radio group
 * Joystick, via micro:bit event
 * draw line
 * set debug window size&pos
 * group blocks
 * note Serail/Radio need other setting blocks
 * DGus mode
 * ? on-screen micro:bit emulator
 * ? scratch resource, and interact
 * ? arcade(makecode) resource, and interact
 * +simplify 0x98, with Font#0 style, remove param color/bgcolor, use setting before
 * -draw circle (not support by COF screen)
 * -0x7D 花式图片切换, screen halt
 * +0x96 QRCode
 * +radio receiving
 * +0x40 set color/bgcolor
 * +0x50 draw dot
 * +0x00 version reply
 * +0x5F backlight
 * +0xE7 rtc
 * +0x79 beep
 * 0x9E rotate paste
 * ?:
 * 0xC104 示波器
 * 0x45 textbox
 * 0x72 direct mem write
 * 
 */
enum CommunicationType {
    //% block=Serial
    serial,
    //% block=Radio
    radio,
}
enum DeviceType {
    //% block=TA/HMI
    ta,
    //% block=DGUS
    dgus,
}


/**
 * Control and get feedback via serial with a DWin screen (HMI/Serial Screen)
 */
//% color=#23738C weight=96 icon="\uf03e"
namespace hmi { //f011
    export let deviceType = DeviceType.ta
    export let _comType = CommunicationType.radio
    export let bCmdPrefix = Buffer.fromHex("AA")
    export let bCmdPostfix = Buffer.fromHex("CC33C33C")

    /**
     * Init with screen type, TA or DGUS command mode. 
     * TA: AA ... CC33C33C
     * DGUS: 5AA5 ... 
     * And will set Rx Buffer Size to Max (254)
     */
    //% blockId=initialize block="use DWin screen of %type mode via %comType" blockGap=16
    //% weight=100
    export function initialize(type: DeviceType, comType: CommunicationType):void{
        deviceType=type
        _comType = comType
        if(comType==CommunicationType.radio){
            radio.onReceivedBuffer(onRadioReceivedHandler)
        }else{
            serial.setRxBufferSize(254)// Max=254
        }
        let receiveMsg:Action
        switch(type){
            case DeviceType.ta:
                bCmdPrefix = Buffer.fromHex("AA")
                bCmdPostfix = Buffer.fromHex("CC33C33C")
                receiveMsg = receiveMsg_Ta
                break
            case DeviceType.dgus:
                bCmdPrefix = Buffer.fromHex("5AA500") //3rd byte for length
                bCmdPostfix = Buffer.fromHex("")
                receiveMsg = receiveMsg_DGUS
                break
        }
        control.inBackground(function(){basic.forever( receiveMsg)})
    }


    export function sendCommandBuffer(bCmd: Buffer) {
        if (deviceType == DeviceType.dgus) //insert length byte
            bCmdPrefix.setUint8(2, bCmd.length / 2)
        let b = Buffer.concat([bCmdPrefix,bCmd,bCmdPostfix])
        if(_comType==CommunicationType.serial){
            serial.writeBuffer(b)
        }else if(_comType==CommunicationType.radio){
            b.chunked(19).forEach((subBuffer: Buffer, index: number): void => {
                radio.sendBuffer(subBuffer)
            })
        }
    }

    /**
     * Send Command in HEX string
     * without command prefix/postfix
     * w/o space, comma, 0x, 0X
     */
    //% blockId=sendCommand block="send general command %sCmd" blockGap=16
    //% advanced=1
    //% weight=80
    export function sendCommand(sCmd: string) {
        sCmd = sCmd.replaceAll(" ", "")
        sCmd = sCmd.replaceAll("0x", "")
        sCmd = sCmd.replaceAll("0X", "")
        sCmd = sCmd.replaceAll(",", "")
        sendCommandBuffer(Buffer.fromHex(sCmd))
        //console.debug("sendCommand:"+sCmd)
    }

    //deprecated
    export function toHexString(number: number, minByteLength: number = 1): string {
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
            temp = Math.trunc(temp / 16)
        }
        while (sCmd.length < minByteLength * 2)
            sCmd = "0" + sCmd
        return sCmd
    }


}