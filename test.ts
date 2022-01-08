// 在此处测试；当此软件包作为插件使用时，将不会编译此软件包。

// //testing Touch screen feedback
// radio.onReceivedBuffer((b:Buffer)=>{
//     if (b.length > 0)
//         serial.writeLine(b.toHex())
//     //basic.showNumber(b[1])
//     if(b[1]==0x72){
//         let x = b[2] * 256 + b[3]
//         let y= b[4] * 256 + b[5]
//         hmi.drawDot(x, y)
//         hmi.drawDot(x-1, y)
//         hmi.drawDot(x+1, y)
//         hmi.drawDot(x, y-1)
//         hmi.drawDot(x, y+1)
//     }
// })
hmi.onVersionReply((str): void => {
    hmi.debug("Screen version:" + str.replace("OK_", ""))
    hmi.log("Screen version:" + str.replace("OK_", ""))
})

let rxV: Buffer = null
let deltaPicID = 0
let index = 0
// serial.redirect(
//     SerialPin.P1,
//     SerialPin.P2,
//     BaudRate.BaudRate115200
// )
serial.redirectToUSB()
radio.setGroup(10)
hmi.initialize(DeviceType.ta, CommunicationType.radio)
basic.showString("R")
hmi.setColors(0x112233, 0xaabbcc)
//hmi.addToConsoleLogListener()
hmi.setMinPriority(ConsolePriority.Log)
hmi.showPic(1)
hmi.Hello()
hmi.log("===pxt-SerialScreen test==") // 
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
            index = 3
        }
        else if (index > 3 ) {
            index = 0
        }
        //hmi.showPic(index)
        hmi.cutPasteImage(index, 0, 0, 333, 333, 10, 10, ImagePasteBgMode.source)
        
        //led.plotBarGraph(index,59)
        basic.showNumber(index,20)
    }
    // hmi.showText("test" + convertToText(index), FontSize.fs32, 100,30)
    // hmi.showTextUnicode(
    //     convertToText(index),
    //     FontSizeUnicode.fs16,
    //     index * 10,
    //     11,
    //     3368703,
    //     -1
    // )
}
input.onButtonPressed(Button.A, function () {
    deltaPicID = -1
})
input.onButtonPressed(Button.AB, function () {
    deltaPicID = 0
})
input.onButtonPressed(Button.B, function () {
    deltaPicID = 1
})
loops.everyInterval(50, ()=>{
    showNextImage()
})
hmi.onTouchDown(function (x, y) {
    serial.writeLine("TouchDown:" + x.toString() + "," + y.toString())
    hmi.debug("TouchDown:" + x.toString() + "," + y.toString())
})
hmi.onTouchUp(function (x, y) {
    serial.writeLine("TouchUp:" + x.toString() + "," + y.toString())
    hmi.log("TouchUp:" + x.toString() + "," + y.toString())
})
hmi.onReceivedUnknownMsg(function (list: number[]) {
    serial.writeLine("Unknown MSG:" + Buffer.fromArray(list).toHex())
    hmi.debug("Unknown MSG:" + Buffer.fromArray(list).toHex())
})
