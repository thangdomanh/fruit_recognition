import React, { useEffect, useRef } from 'react';
import * as tmImage from '@teachablemachine/image';

const FruitPaymentSystem = () => {
    const URL = "https://raw.githubusercontent.com/thangdomanh/DoAn/main/mymodel/";
    let model, webcam, labelContainer, maxPredictions;
    let processing = false;

    const webcamContainerRef = useRef();

    useEffect(() => {
        const init = async () => {
            const modelURL = URL + "model.json";
            const metadataURL = URL + "metadata.json";

            model = await tmImage.load(modelURL, metadataURL);
            maxPredictions = model.getTotalClasses();

            const flip = true;
            webcam = new tmImage.Webcam(400, 200, flip);  // Webcam canvas size
            await webcam.setup();
            await webcam.play();
            window.requestAnimationFrame(loop);

            const webcamCanvas = webcam.canvas;
            webcamCanvas.width = webcamContainerRef.current.clientWidth; // Use clientWidth instead of offsetWidth
            webcamCanvas.height = webcamContainerRef.current.clientHeight; // Use clientHeight instead of offsetHeight


            webcamContainerRef.current.appendChild(webcamCanvas);
            labelContainer = document.getElementById("label-container");

            // Attach the click handler to the "Start Processing" button.
            document.getElementById("start-button").addEventListener("click", startProcessing);
        };

        init();
    }, []);

    const loop = async () => {
        webcam.update();
        if (processing) {
            await predict();
        }
        window.requestAnimationFrame(loop);
    };

    const predict = async () => {
        const predictions = await model.predictTopK(webcam.canvas, 1);

        if (predictions[0].probability >= 0.90) {
            labelContainer.innerText = predictions[0].className;
        } else {
            labelContainer.innerText = "nothing";
        }
    };

    // Start processing when the "Start Processing" button is clicked.
    const startProcessing = () => {
        processing = true;

        // Process 20 frames.
        for (let i = 0; i < 20; i++) {
            // Run prediction.
            predict();
        }

        // Disable processing after the run finishes.
        processing = false;
    };
    return (
        <>
            <div className='h-screen bg-slate-200 flex flex-col'>
                <div className='h-1/2 m-2'>
                    <div className='h-1/6 flex text-lg bg-white m-2 text-center justify-center items-center rounded-md font-semibold text-violet-600'>
                        <span className=' text-center my-auto '>Project 2</span>
                    </div>
                    <div className='h-5/6 flex flex-row'>
                        <div className='w-1/3 bg-white m-2 rounded-md'>
                            <div id='webcam-container' className='h-3/5 w-32 bg-slate-600 rounded shadow m-2'>
                                <div ref={webcamContainerRef}></div>
                            </div>

                            <div className='h-1/5 m-2'>
                                <button id='start-button' className='w-full bg-violet-600 text-white p-2 rounded hover:bg-violet-900 hover:shadow-xl transition duration-500'>Start</button>
                            </div>
                        </div>
                        <div className='w-2/3 flex flex-row bg-white m-2 rounded-md'>
                            <div className='w-1/3 m-2 bg-slate-200 rounded'>Image</div>
                            <div className='w-2/3 flex flex-col'>
                                <div className='h-40 bg-slate-200 rounded m-2 mb-1'>
                                    <span>Fruit Information</span>
                                    <div id='label-container' className='h-1/5'></div>
                                </div>
                                <div className='h-10 m-2 mt-1'>
                                    <button className='bg-slate-100 rounded w-full p-2 hover:bg-slate-600 hover:text-white transition duration-500'>Checkout</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className='h-1/2 m-2'>
                    <div className='bg-white h-full rounded shadow m-2'>3</div>
                </div>
            </div>
        </>

    );
};

export default FruitPaymentSystem;
