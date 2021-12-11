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

enum ImagePasteBgMode {
    //% block=Source
    source,
    //% block=Current
    current,
    //% block="Right Now"
    rightnow,
}


/**
 * Control and get feedback via serial with a DWin screen (HMI/Serial Screen)
 */
//% color=#23738C weight=96 icon="\uf03e"
namespace hmi { //f011
    export let deviceType=DeviceType.ta
    export let bCmdPrefix = Buffer.fromHex("AA")
    export let bCmdPostfix = Buffer.fromHex("CC33C33C")

    /**
     * Init with screen type, TA or DGUS command mode. 
     * TA: AA ... CC33C33C
     * DGUS: 5AA5 ... 
     * And will set Rx Buffer Size to Max (254)
     */
    //% blockId=init block="use DWin screen of %type mode" blockGap=16 
    //% weight=100
    export function init(type:DeviceType):void{
        deviceType=type
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
        // Max=254
        serial.setRxBufferSize(254)
        control.inBackground(function(){basic.forever( receiveMsg)})
    }

    /**
     * Hello
     */
    //% blockId=Hello block="Hello!" blockGap=16
    //% weight=95
    export function Hello():void {
        sendCommand("00")
    }


    /**
     * show image with image #ID，which prestored in your DWin screen
     */
    //% blockId=ShowPic block="show #%picID image" blockGap=16
    //% weight=90
    export function showPic(picID: number) {
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
     * Show Text command with extend font (0x98)
     */
    //% blockId=CutPasteImage block="cut #%picID|image at left%sx top%sy right%ex bottom%ey, paste to x%x y%y || background %bgmode" blockGap=16
    //% inlineInputMode=inline
    //% expandableArgumentMode="toggle"
    //% weight=88
    export function cutPasteImage(picID:number, sx: number = 0, sy: number = 0, ex: number = 100, ey: number = 100, x: number = 0, y: number = 0, bgmode: ImagePasteBgMode=ImagePasteBgMode.current) {
        let bCmd
        switch (deviceType) {
            case DeviceType.ta:
                bCmd = Buffer.create(14)
                bCmd.setUint8(0, [0x71, 0x9C, 0x9D].get(bgmode))
                bCmd.setUint8(1, picID)
                bCmd.setNumber(NumberFormat.UInt16BE, 2, sx)
                bCmd.setNumber(NumberFormat.UInt16BE, 4, sy)
                bCmd.setNumber(NumberFormat.UInt16BE, 6, ex)
                bCmd.setNumber(NumberFormat.UInt16BE, 8, ey)
                bCmd.setNumber(NumberFormat.UInt16BE, 10, x)
                bCmd.setNumber(NumberFormat.UInt16BE, 12, y)
                break
            case DeviceType.dgus:  //todo
                bCmd = Buffer.create(5 )
                break
        }
        //Debug("cut&paste:"+bCmd.toHex())
        sendCommandBuffer(bCmd)
    }
    
    /**
     * Show Text command with extend font (0x98), ASCII only cause of UTF8 unsupport by micro:bit
     */
    //% blockId=ShowTextEx block="show text (extend font) %text size %fs at x%x y%y ||color%color bgcolor%bgcolor" blockGap=16
    //% inlineInputMode=inline
    //% expandableArgumentMode="toggle"
    //% weight=80
    export function showTextUnicode(text: string, fs: FontSizeUnicode, x: number = 0, y: number = 0, color: number=0xFFFF, bgcolor: number=0x0) {
        let bCmd, bText, iText1st
        switch (deviceType) {
            case DeviceType.ta:
                bCmd = Buffer.create(12 + text.length * 2)
                bCmd.setUint8(0, 0x98)
                bCmd.setNumber(NumberFormat.UInt16BE, 1, x)
                bCmd.setNumber(NumberFormat.UInt16BE, 3, y)
                bCmd.setNumber(NumberFormat.UInt8LE, 5, [0x26, 0x28, 0x2B].get(fs))  //font ID,Unicode 16x16, need transfer into Screen in advance
                bCmd.setNumber(NumberFormat.UInt8LE, 6, 0x05 | (color >= 0 ? 0x80 : 0) | (bgcolor >= 0 ? 0x40 : 0))  //C_Mode, draw front/bg color; unicode
                bCmd.setNumber(NumberFormat.UInt8LE, 7, [0x0A, 0x0B, 0x0C].get(fs))  //16x16
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
            bCmd.setNumber(NumberFormat.UInt16BE, iText1st + i * 2, text.charCodeAt(i))
        }
        sendCommandBuffer(bCmd)
    }

    /**
     * Show Text
     * (command: 0x53, 0x54, 0x55, 0x6e, 0x6f)
     */
    //% blockId=ShowText block="show text %text |size %fs at x%x y%y" blockGap=16
    //% inlineInputMode=inline
    //% weight=80
    export function showText(text: string, fs: FontSize, x: number = 0, y: number = 0) {
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
        //console.debug("Debug=="+b.toHex()+"==Debug")
        serial.writeBuffer(b)
    }

    /**
     * Send Command in HEX string
     * without command prefix/postfix
     * w/o space, comma, 0x, 0X
     */
    //% blockId=sendCommand block="send general command %sCmd" blockGap=16
    //% weight=50
    export function sendCommand(sCmd: string) {
        sCmd = sCmd.replaceAll(" ", "")
        sCmd = sCmd.replaceAll("0x", "")
        sCmd = sCmd.replaceAll("0X", "")
        sCmd = sCmd.replaceAll(",", "")
        sendCommandBuffer(Buffer.fromHex(sCmd))
        console.debug("sendCommand:"+sCmd)
    }


}