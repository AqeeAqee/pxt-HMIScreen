input.onButtonPressed(Button.A, function () {
    deltaPicID = -1
})
input.onButtonPressed(Button.AB, function () {
    deltaPicID = 0
})
input.onButtonPressed(Button.B, function () {
    deltaPicID = 1
})
let rxIndex = 0
let rxV = 0
let rxBuffer: Buffer = null
let index = 0
let temp2 = 0
let temp = 0
let sendCmdLastMs = 0
let deltaPicID = 0
let cmdTouchY = 0
let cmdTouchX = 0
let sCmd = ""
let rxCmd = [0]
deltaPicID = 1
sCmd = ""
led.plot(0, 0)
serial.redirect(
SerialPin.P1,
SerialPin.P2,
BaudRate.BaudRate115200
)
// Max=254
serial.setRxBufferSize(254)
hmi.sendCommend("0480030001" + "")
sendCommend("15820100000600010000001000100030003000800040" + "")
sendCommend("0380EC5A" + "")
basic.forever(function () {
    if (deltaPicID != 0) {
        index += deltaPicID
        if (index >= 100 || index < 1) {
            deltaPicID = deltaPicID * -1
        }
        sendCommendMoveX(index * 1)
        led.plotBarGraph(
        index,
        100
        )
        basic.pause(33)
    }
})
basic.forever(function () {
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
    } else {
        rxCmd.push(rxV)
    }
})
