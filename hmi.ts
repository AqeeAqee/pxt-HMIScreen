// 在此处添加您的代码
/**
 * todo:
 * -0x00 version reply
 * -0x5F backlight
 * -0xE7 rtc
 * -0x79 beep
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
     * beep DWin screen, unit is 10ms
     */
    //% blockId=beep block="beep for %duration|x 10 ms " blockGap=16
    //% weight=90
    export function beep(duration: number) {
        switch (deviceType) {
            case DeviceType.ta:
                sendCommandBuffer(Buffer.fromArray([0x79, duration]))
                break
            case DeviceType.dgus:
                sendCommandBuffer(Buffer.fromArray([0x80, 0x03, duration]))
                break
        }
    }

    /**
     * set backlight of your DWin screen
     */
    //% blockId=backlight block="set backlight brightness%brightness " blockGap=16
    //% weight=90
    export function backlight(brightness: number) {
        switch (deviceType) {
            case DeviceType.ta:
                sendCommandBuffer(Buffer.fromArray([0x5F, brightness]))
                break
            case DeviceType.dgus:
                sendCommandBuffer(Buffer.fromArray([0x80, 0x03, brightness]))
                break
        }
    }

    function Dec2BCD(buf: Buffer, iFirst: number, iLast: number) {
        for (let i = iFirst; i < iLast; i++)
            buf[i] += (buf[i] >> 4) * 6
    }

    /**
     * set clock on DWin screen
     */
    //% blockId=setClock block="set clock time %hh|:|%mi|:|%ss || %yy|year %mo|month %dd|date" blockGap=16
    //% inlineInputMode=inline
    //% expandableArgumentMode="toggle"
    //% weight=75
    export function setClock(hh: number, mi: number = 0, ss: number = 0, yy: number = 21, mo: number = 12, dd: number = 12) {
        let bCmd
        switch (deviceType) {
            case DeviceType.ta:
                bCmd = Buffer.fromArray([0xE7, 0x55, 0xAA, 0x5A, 0xA5, yy, mo, dd, hh, mi, ss])
                Dec2BCD(bCmd, 5,10)
                break
            case DeviceType.dgus:  //todo
                bCmd = Buffer.create(5)
                break
        }
        //Debug("cut&paste:"+bCmd.toHex())
        sendCommandBuffer(bCmd)
    }

    /**
     * get clock from RTC of DWin screen
     * [NOTE] return values by onGetClock block
     */
    //% blockId=getClock block="get RTC clock date&time" blockGap=16
    //% weight=75
    export function getClock() {
        let bCmd
        switch (deviceType) {
            case DeviceType.ta:
                bCmd = Buffer.fromHex("9B5A")
                break
            case DeviceType.dgus:  //todo
                bCmd = Buffer.create(5)
                break
        }
        //Debug("cut&paste:"+bCmd.toHex())
        sendCommandBuffer(bCmd)
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
     *  Cut a part of a image then paste it at current screen with given angle
     */
    //% blockId=rotateCutPasteImage block="cut #%picID|image at left%sx top%sy right%ex bottom%ey, center:x%cx|y%cy rotate|%al|x0.5° , paste to|x%x y%y || background tranparent %bgTranparent" blockGap=16
    //% inlineInputMode=inline
    //% expandableArgumentMode="toggle"
    //% weight=75
    export function rotateCutPasteImage(picID: number, sx: number = 0, sy: number = 0, ex: number = 100, ey: number = 100, cx: number = 0, cy: number = 0, al:number=45, x: number = 0, y: number = 0, bgTranparent:boolean=true) {
        let bCmd
        switch (deviceType) {
            case DeviceType.ta:
                bCmd = Buffer.create(22)
                bCmd.setUint8(0, 0x9E)
                bCmd.setUint8(1, bgTranparent ? 1 : 0)
                bCmd.setNumber(NumberFormat.UInt16BE, 2, picID)
                bCmd.setNumber(NumberFormat.UInt16BE, 4, sx)
                bCmd.setNumber(NumberFormat.UInt16BE, 6, sy)
                bCmd.setNumber(NumberFormat.UInt16BE, 8, ex)
                bCmd.setNumber(NumberFormat.UInt16BE, 10, ey)
                bCmd.setNumber(NumberFormat.UInt16BE, 12, cx)
                bCmd.setNumber(NumberFormat.UInt16BE, 14, cy)
                bCmd.setNumber(NumberFormat.UInt16BE, 16, al)
                bCmd.setNumber(NumberFormat.UInt16BE, 18, x)
                bCmd.setNumber(NumberFormat.UInt16BE, 20, y)
                break
            case DeviceType.dgus:  //todo
                bCmd = Buffer.create(5)
                break
        }
        sendCommandBuffer(bCmd)
        console.debug("routate&cut&paste:"+bCmd.toHex())
    }
    /**
     * Cut a part of a image then paste it at current screen 
     */
    //% blockId=CutPasteImage block="cut #%picID|image at left%sx top%sy right%ex bottom%ey, paste to x%x y%y || background %bgmode" blockGap=16
    //% inlineInputMode=inline
    //% expandableArgumentMode="toggle"
    //% weight=75
    export function cutPasteImage(picID: number, sx: number = 0, sy: number = 0, ex: number = 100, ey: number = 100, x: number = 0, y: number = 0, bgmode: ImagePasteBgMode = ImagePasteBgMode.current) {
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
                bCmd = Buffer.create(5)
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
    //% advanced=1
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
        if(_comType==CommunicationType.serial){
            serial.writeBuffer(b)
        }else if(_comType==CommunicationType.radio){
            radio.sendBuffer(b)
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
        console.debug("sendCommand:"+sCmd)
    }

    //deprecated
    function toHexString(number: number, minByteLength: number = 1): string {
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