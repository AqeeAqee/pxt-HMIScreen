
namespace hmi {


    export class Point{
        x:number
        y:number

        public Point(x:number,y:number){
            this.x=x
            this.y=y
            return this
        }

    }
    let _color=0xffffff, _bgcolor=0x000000 

    /**
     * Make a point
     */
    //% blockId=makepoint block="point x%x y%y" blockGap=16
    //% inlineInputMode=inline
    //% blockSetVariable=point
    //% weight=99
    export function point(x:number=10, y:number=10):Point{
        let p=new Point()
        p.x=x
        p.y=y
        return p
    }

    /**
     * Draw lines, with front color set by "Set Colors" Block
     */
    //% blockId=drawLine block="draw lines at points%list" blockGap=16 //=point_list
    // inlineInputMode=inline
    //% weight=98
    // ref https://makecode.com/defining-blocks #Array default values
    //% list.shadow="lists_create_with"
    //% list.defl="makepoint"
    export function drawLine(list: Point[]) {//=[point(0,0),point(100,100)]
        let bCmd:Buffer
        switch (deviceType) {
            case DeviceType.ta:
                bCmd = Buffer.create(1+4*list.length)
                bCmd.setUint8(0, 0x56)
                list.forEach((point, index)=>{
                    bCmd.setNumber(NumberFormat.UInt16BE, 1+index*4, point.x)
                    bCmd.setNumber(NumberFormat.UInt16BE, 1+index*4+2, point.y)
                })
                break
            case DeviceType.dgus: //todo
                bCmd = Buffer.create(5)
                bCmd.setUint8(0, 0x53)  //to be corrected
                break
        }
        sendCommandBuffer(bCmd)
    }

    /**
     * Draw a dot, with front color set by "Set Colors" Block
     */
    //% blockId=drawDot block="draw a dot at x%x y%y" blockGap=16
    //% inlineInputMode=inline
    //% weight=80
    export function drawDot(x: number = 0, y: number = 0) {
        let bCmd
        switch (deviceType) {
            case DeviceType.ta:
                bCmd = Buffer.create(5)
                bCmd.setUint8(0, 0x51)
                bCmd.setNumber(NumberFormat.UInt16BE, 1, x)
                bCmd.setNumber(NumberFormat.UInt16BE, 3, y)
                break
            case DeviceType.dgus: //todo
                bCmd = Buffer.create(5)
                bCmd.setUint8(0, 0x53)  //to be corrected
                break
        }
        sendCommandBuffer(bCmd)
    }

    /**
     * Show Text
     * with 0# font lib
     */
    //% blockId=showQRCode block="show QR code %text size %size at x%x y%y" blockGap=16
    //% inlineInputMode=inline
    //% size.min=0 size.max=15
    //% weight=80
    export function showQRCode(text: string, size: number, x: number = 0, y: number = 0) {
        let bCmd
        switch (deviceType) {
            case DeviceType.ta:
                bCmd = Buffer.create(6 + text.length)
                bCmd.setUint8(0, 0x96) 
                bCmd.setNumber(NumberFormat.UInt16BE, 1, x)
                bCmd.setNumber(NumberFormat.UInt16BE, 3, y)
                bCmd.setNumber(NumberFormat.UInt8LE, 5, size)
                for (let i = 0; i < text.length; i++) {
                    bCmd.setNumber(NumberFormat.UInt8LE, 6 + i, text.charCodeAt(i))
                }
                break
            case DeviceType.dgus: //todo
                bCmd = Buffer.create(5 + text.length)
                bCmd.setUint8(0, 0x53)  //to be corrected
                break
        }
        sendCommandBuffer(bCmd)
    }

    /**
     * Show Text
     * with 0# font lib
     */
    //% blockId=ShowText0 block="show text %text |size %fs at x%x y%y ||draw background" blockGap=16
    //% inlineInputMode=inline
    //% weight=80
    //% fs.fieldEditor="numberdropdown" fs.fieldOptions.decompileLiterals=true
    // todo, change fs type from enum to number with ".data" options
    //% fs.fieldOptions.data='[["6x12", 0], ["8x16", 1], ["12x24", 2], ["16x32", 3], ["20x40", 4], ["24x48", 5], ["28x56", 6], ["32x64", 7]]'
    export function showText0(text: string, fs: number=100, x: number = 0, y: number = 0, drawBg: BackgroundColorMode = BackgroundColorMode.transparentBackground) {
        let bCmd
        switch (deviceType) {
            case DeviceType.ta:
                bCmd = Buffer.create(12 + text.length)
                bCmd.setUint8(0, 0x98) //use 0x98 for COF Screen
                bCmd.setNumber(NumberFormat.UInt16BE, 1, x)
                bCmd.setNumber(NumberFormat.UInt16BE, 3, y)
                bCmd.setNumber(NumberFormat.UInt8LE, 5, 0)  //font ID 0#, need transfer into Screen in advance
                bCmd.setNumber(NumberFormat.UInt8LE, 6, 0x02 | 0x80 | (BackgroundColorMode.drawBackground ? 0x40 : 0))  //C_Mode, gbk=0x02(for 0#lib), draw front=0x80, draw bg=0x40;
                bCmd.setNumber(NumberFormat.UInt8LE, 7, fs)
                bCmd.setNumber(NumberFormat.UInt16BE, 8, to565(_color))
                bCmd.setNumber(NumberFormat.UInt16BE, 10, to565(_bgcolor))
                for (let i = 0; i < text.length; i++) {
                    bCmd.setNumber(NumberFormat.UInt8LE, 12 + i, text.charCodeAt(i))
                }
                break
            case DeviceType.dgus: //todo
                bCmd = Buffer.create(5 + text.length)
                bCmd.setUint8(0, 0x53)  //to be corrected
                break
        }
        sendCommandBuffer(bCmd)
    }

    function to565(color:number):number{
        let result = ((color & 0xF80000) >> 8) | ((color & 0x00FC00) >> 5) | ((color & 0x0000F8) >> 3)
        //hmi.debug(toHexString(color) + "->" + toHexString(result))
        return result
    }

    /**
     * Hello
     */
    //% blockId=Hello block="Hello!" blockGap=16
    //% weight=95
    export function Hello(): void {
        sendCommand("00")
    }


    /**
     * Set front Color and background color, R,G,B 0~255 each
     * Tips: input with Hex is more convenient, e.g. 0xFF0033, 0x1155AA 
     */
    // todo, choose a spec kind of color picker, see pxt-helper.tx for color pickers
    // color picker, ref pxt-helpers.ts,colorWheelPicker,colorWheelHsvPicker
    //% blockId=setColors block="Set colors front%fColor background%bgColor" blockGap=16
    //% fColor.min=0 fColor.max=256*256*256
    //% bgColor.min=0 bgColor.max=256*256*256
    //% fColor.shadow="colorNumberPicker"
    //% bgColor.shadow="colorNumberPicker"
    //% inlineInputMode=inline
    //% weight=80
    export function setColors(fColor: number = 0, bgColor: number = 0) {
        let bCmd
        _color=fColor
        _bgcolor=bgColor
        switch (deviceType) {
            case DeviceType.ta:
                bCmd = Buffer.create(1+3+3)
                //revers order, RGB is 3byte, but write as 4byte at -1 byte pos.
                bCmd.setNumber(NumberFormat.UInt32BE, 3, _bgcolor)
                bCmd.setNumber(NumberFormat.UInt32BE, 0, _color)
                bCmd.setUint8(0, 0x40)
                break
            case DeviceType.dgus: //todo
                bCmd = Buffer.create(5)
                bCmd.setUint8(0, 0x53)  //to be corrected
                break
        }
        sendCommandBuffer(bCmd)
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
                Dec2BCD(bCmd, 5, 10)
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
    //% blockId=ShowPic block="show #%picID image " blockGap=16 //||with Transfer Effect%transMode
    //% weight=90
    export function showPic(picID: number) {//, transMode: PicTransMode = PicTransMode.immediate
        switch (deviceType) {
            case DeviceType.ta:
                //if(transMode==PicTransMode.immediate)
                    sendCommandBuffer(Buffer.fromArray([0x70, picID]))
                //else
                    //DWin halt
                    //sendCommandBuffer(Buffer.fromArray([0x7D, transMode, 0, picID]))
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
    export function rotateCutPasteImage(picID: number, sx: number = 0, sy: number = 0, ex: number = 100, ey: number = 100, cx: number = 0, cy: number = 0, al: number = 45, x: number = 0, y: number = 0, bgTranparent: boolean = true) {
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
        console.debug("routate&cut&paste:" + bCmd.toHex())
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
    //% blockHidden=1 //ASCII only cause of UTF8 unsupport by micro:bit
    export function showTextUnicode(text: string, fs: FontSizeUnicode, x: number = 0, y: number = 0, color: number = 0xFFFF, bgcolor: number = 0x0) {
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
    //% blockHidden=1 //COF screen doesn't support 0x53,0x54
    export function showText(text: string, fs: FontSize, x: number = 0, y: number = 0) {
        let bCmd
        switch (deviceType) {
            case DeviceType.ta:
                bCmd = Buffer.create(5 + text.length)
                bCmd.setUint8(0, [0x53, 0x54, 0x55, 0x6e, 0x6f].get(fs))
                bCmd.setNumber(NumberFormat.UInt16BE, 1, x)
                bCmd.setNumber(NumberFormat.UInt16BE, 3, y)
                for (let i = 0; i < text.length; i++) {
                    bCmd.setNumber(NumberFormat.UInt8LE, 5 + i, text.charCodeAt(i))
                }
                break
            case DeviceType.dgus: //todo
                bCmd = Buffer.create(5 + text.length)
                bCmd.setUint8(0, 0x53)  //to be corrected
                break
        }
        sendCommandBuffer(bCmd)
    }
}

enum PicTransMode {
    //% block="Immediate"
    immediate,
    //% block="Middle->Sides"
    m2s,
    //% block="Corner->Corner"
    c2c,
    //% block="Top->Bottom"
    u2d,
    //% block="Lef->Right"
    l2r,
    //% block="Effect 4"
    effect4,
    //% block="Effect 5"
    effect5,
    //% block="Effect 6"
    effect6,
    //% block="Effect 7"
    effect7,
    //% block="Effect 8"
    effect8,
}

enum ImagePasteBgMode {
    //% block=Source
    source,
    //% block=Current
    current,
    //% block="Right Now"
    rightnow,
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

enum FontSize0 {
    //% block=6x12
    fs6,
    //% block=8x16
    fs8,
    //% block=12x24
    fs12,
    //% block=16x32
    fs16,
    //% block=20x40
    fs20,
    //% block=24x48
    fs24,
    //% block=28x56
    fs28,
    //% block=32x64
    fs32,
}

enum BackgroundColorMode {
    //% block="Draw Background"
    drawBackground,
    //% block="Transparent Background"
    transparentBackground,
}
