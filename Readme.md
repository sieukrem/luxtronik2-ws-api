# Luxtronik2 WebSocket API

Luxtronik2 WebSocket API is the result of reverse engineering of Luxtronik2 web interface.

## How to use

### Establish Connection 

```js
    const lx = await Luxtronik2.connect("192.168.178.29", "012345"); // Heating Pump IP and Password 
```

### Traverse Items

The original web interface api repeats the menu hirarchy. So either you follow this hirarchy in you business logic
or you flatten it by you own.

Following example shows how to get outdoor temperature.

```js
    console.log("Outdoor temperature: " + (await (await (await lx.access.get("Informationen")).get("Temperaturen")).get("Aussentemperatur")).value());
```

At least ones you will need to list names of all menu items to get them know.

```js
    console.log((await (await lx.access.get("Informationen")).get("Temperaturen")).names());
```

### Close Connection

Successfully opened connection should be properly closed otherwise your program will never stop.

```js
    const lx = await Luxtronik2.connect(wpIp, PW);

    try{
        // print first level of menu
        console.log(lx.access.names());
    }finally{
        lx.disconnect();
    }
```
## Change log

* 1.0.3 Added timeout parameters for connection