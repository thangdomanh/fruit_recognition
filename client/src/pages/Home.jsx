import React, { useEffect, useRef, useState } from 'react';
import * as tmImage from '@teachablemachine/image';
import { db, app } from '../firebase'
import { getDatabase, ref, onValue } from "firebase/database";

// Get the reference of the database.
const database = getDatabase();

const cartRef = ref(database, 'CanNang/');
const priceRef = ref(database, 'DonGia/')



const FruitPaymentSystem = () => {

    const URL = "https://raw.githubusercontent.com/thangdomanh/DoAn/main/mymodel/";
    let model, webcam, labelContainer, maxPredictions, price, fruitWeight, total;
    let processing = false;
    const [fruitprice, setPrice] = useState(0)
    const [weight, setWeight] = useState(0)

    const webcamContainerRef = useRef();

    useEffect(() => {
        const init = async () => {
            const modelURL = URL + "model.json";
            const metadataURL = URL + "metadata.json";

            model = await tmImage.load(modelURL, metadataURL);
            maxPredictions = model.getTotalClasses();

            const flip = true;
            webcam = new tmImage.Webcam(410, 410, flip);
            await webcam.setup();
            await webcam.play();
            window.requestAnimationFrame(loop);

            const webcamCanvas = webcam.canvas;
            webcamCanvas.width = webcamContainerRef.current.clientWidth;
            webcamCanvas.height = webcamContainerRef.current.clientHeight;

            webcamContainerRef.current.appendChild(webcamCanvas);
            labelContainer = document.getElementById("fruit-name");
            price = document.getElementById('fruit-price')
            fruitWeight = document.getElementById('fruit-weight')
            total = document.getElementById('total')

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
            const fruitName = predictions[0].className;
            labelContainer.innerText = `${fruitName}`;
            console.log(predictions[0]);

            // Truy cập cơ sở dữ liệu Firebase để lấy giá tiền
            onValue(cartRef, (cartSnapshot) => {
                const cartData = cartSnapshot.val();
                if (!!cartData) {
                    console.log('Can nang:', cartData, 'Kg');
                    fruitWeight.innerText = `${cartData.toLocaleString()} Kg`;
                    setWeight(cartData); // Update state
                } else {
                    console.log('Cart data not found');
                }
            });

            onValue(priceRef, (priceSnapshot) => {
                const priceData = priceSnapshot.val();
                if (!!priceData) {
                    const fruitPrice = priceData[fruitName] || null;
                    if (fruitPrice !== null) {
                        console.log(`Price of ${fruitName}: ${fruitPrice}`);
                        price.innerText = `${fruitPrice.toLocaleString()} VND`;
                        setPrice(fruitPrice); // Update state

                        // Calculate total
                        const totalPrice = fruitPrice * fruitWeight;
                        console.log(`Total Price: ${totalPrice.toLocaleString()} VND`);
                    } else {
                        console.log(`No price found for ${fruitName}`);
                    }
                } else {
                    console.log('Price data not found');
                }
            });
        } else {
            labelContainer.innerText = "nothing";
        }
    };





    function startProcessing() {
        processing = true;

        // Đối tượng để lưu trữ số lần xuất hiện của mỗi label
        const labelCounts = {};

        // Xử lý 20 hình ảnh
        for (let i = 0; i < 20; i++) {
            // Gọi hàm predict để thực hiện dự đoán
            predict();

            // Lấy label hiện tại
            const currentLabel = labelContainer.innerText;

            // Nếu label khác "nothing", tăng số lần xuất hiện của label đó
            if (currentLabel !== "nothing") {
                labelCounts[currentLabel] = (labelCounts[currentLabel] || 0) + 1;
            }
        }

        // Tìm label xuất hiện nhiều nhất
        let mostFrequentLabel = "nothing";
        let maxCount = 0;

        for (const label in labelCounts) {
            if (labelCounts[label] > maxCount) {
                mostFrequentLabel = label;
                maxCount = labelCounts[label];
            }
        }

        // Gán label xuất hiện nhiều nhất vào labelContainer
        labelContainer.innerText = mostFrequentLabel;

        // Tắt chế độ xử lý sau khi hoàn thành
        processing = false;
    }
    return (
        <div className='h-screen bg-slate-200 flex flex-col'>
            <div className='m-2 h-screen'>
                <div className='h-16 flex text-lg bg-white m-2 text-center justify-center items-center rounded-md font-semibold text-violet-600'>
                    <span className='text-center my-auto'>DO AN 2</span>
                </div>
                <div className='h-5/6 flex flex-row'>
                    <div className='w-1/3 bg-white rounded m-2'>
                        <div id='webcam-container' className='h-5/6 rounded m-2'>
                            <div className='h-full rounded' ref={webcamContainerRef}></div>
                        </div>
                        <div className='m-2'>
                            <button
                                id='start-button'
                                className='w-full bg-violet-600 text-white p-2 rounded hover:bg-violet-900 hover:shadow-xl transition duration-500'>
                                Start
                            </button>
                        </div>
                    </div>
                    <div className='w-2/3 flex flex-row bg-white m-2 rounded-md'>
                        <div className='w-1/3 m-2 bg-slate-200 rounded'>Image</div>
                        <div className='w-2/3 flex flex-col'>
                            <div className='h-full  rounded m-2 mb-1 flex flex-col'>
                                <div className='p-3 border-b-2 border-slate-400 m-2'>
                                    <span className='text-left text-lg font-semibold'>Shopping Cart</span>
                                </div>
                                <div className='flex flex-row text-center mb-5'>
                                    <div className='w-1/3 text-slate-400 text-sm font-semibold uppercase'>Product Name</div>
                                    <div className='w-1/3 text-slate-400 text-sm font-semibold uppercase'>Weight</div>
                                    <div className='w-1/3 text-slate-400 text-sm font-semibold uppercase'>Price</div>
                                    <div className='w-1/3 text-slate-400 text-sm font-semibold uppercase'>Total</div>
                                </div>

                                <div className='flex flex-row text-center'>
                                    <div id='fruit-name' className='w-1/3'></div>
                                    <div id='fruit-weight' className='w-1/3'></div>
                                    <div id='fruit-price' className='w-1/3'></div>
                                    <div id='total' className='w-1/3'>{fruitprice * weight}</div>
                                </div>

                            </div>
                            <div className='m-2 mt-1'>
                                <button className='bg-slate-100 rounded w-full p-2 hover:bg-slate-600 hover:text-white transition duration-500'>
                                    THANH TOÁN
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FruitPaymentSystem;
