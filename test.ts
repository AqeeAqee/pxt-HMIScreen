// 在此处测试；当此软件包作为插件使用时，将不会编译此软件包。

let rxV: Buffer = null
let deltaPicID = 0
let index = 0
serial.redirect(
    SerialPin.P1,
    SerialPin.P2,
    BaudRate.BaudRate115200
)
radio.setGroup(10)
hmi.initialize(DeviceType.ta, CommunicationType.radio)
basic.showString("R")
//hmi.addToConsoleLogListener()
//hmi.setMinPriority(ConsolePriority.Debug)
hmi.showPic(0)
hmi.log("===pxt-SerialScreen test===")
hmi.Hello()
index = 1
basic.showIcon(IconNames.House)
/*
basic.forever(function () {
    rxV = serial.readBuffer(1)
    basic.showNumber(rxV[0])
})
*/
function showNextImage() {
    if (deltaPicID != 0) {
        index += deltaPicID
        if (index < 0) {
            index = 0
        }
        else if (index > 3 ) {
            index = 3
        }
        hmi.showPic(index)
        //hmi.cutPasteImage(index, 0, 0, 639, 479, 0, 0, ImagePasteBgMode.current)
        
        //led.plotBarGraph(index,59)
        basic.showNumber(index,50)
    }
    hmi.showTextUnicode(
        convertToText(index),
        FontSizeUnicode.fs24,
        index * 10,
        11,
        3368703,
        -1
    )
}
input.onButtonPressed(Button.A, function () {
    deltaPicID = -1
    showNextImage()
})
input.onButtonPressed(Button.AB, function () {
    deltaPicID = 0
})
input.onButtonPressed(Button.B, function () {
    deltaPicID = 1
    showNextImage()
})
hmi.onTouchDown(function (x, y) {
    hmi.debug("TouchDown:" + x.toString() + "," + y.toString())
})
hmi.onTouchUp(function (x, y) {
    hmi.debug("TouchUp:" + x.toString() + "," + y.toString())
})
hmi.onReceivedUnknownMsg(function (list: number[]) {
    hmi.debug("Unknown MSG:" + Buffer.fromArray(list).toHex())
})
