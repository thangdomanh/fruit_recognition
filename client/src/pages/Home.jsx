import React, { useEffect, useRef, useState } from 'react';
import * as tmImage from '@teachablemachine/image';
import { getDatabase, ref, onValue } from 'firebase/database';
import { db, app } from '../firebase';
import FruitModal from './modal';
import { toast } from 'react-toastify';
import { CiShoppingCart } from 'react-icons/ci';
import { FaCamera } from "react-icons/fa";
import { FiCameraOff } from "react-icons/fi";
import { GiProcessor } from "react-icons/gi";
import { FaCartShopping } from "react-icons/fa6";
import { jsPDF } from 'jspdf';
import axios from 'axios';
const database = getDatabase(app);
const cartRef = ref(database, 'CanNang/');
const priceRef = ref(database, 'DonGia/');

const FruitPaymentSystem = () => {
    const URL = "https://raw.githubusercontent.com/thangdomanh/DoAn/main/mymodel/";
    const webcamRef = useRef(null);
    const webcamContainerRef = useRef(null);
    const [model, setModel] = useState(null);
    const [maxPredictions, setMaxPredictions] = useState(0);
    const [fruitProbability, setFruitProbability] = useState(0);
    const [modal, setModal] = useState(false);
    const [cart, setCart] = useState([]);
    const [cartCount, setCartCount] = useState(0);
    const [fruitName, setFruitName] = useState('');
    const [fruitprice, setPrice] = useState(0);
    const [weight, setWeight] = useState(0);
    const [fruitImageSrc, setFruitImageSrc] = useState('');
    const [fruitImageAlt, setFruitImageAlt] = useState('');
    const [openCamera, setOpenCamera] = useState(false);
    const [totalPrice, setTotalPrice] = useState(0);
    const [processing, setProcessing] = useState(false);
    



    // Get current date
    const currentDate = new Date().toLocaleDateString();

    // Format dd/mm/yyyy
    const formatDate = (date) => {
        const d = new Date(date);
        let month = "" + (d.getMonth() + 1);
        let day = "" + d.getDate();
        const year = d.getFullYear();

        if (month.length < 2) month = "0" + month;
        if (day.length < 2) day = "0" + day;

        return [day, month, year].join("/");
    };

    useEffect(() => {
        const init = async () => {
            // const modelURL = URL + "model.json";
            // const metadataURL = URL + "metadata.json";
            // const loadedModel = await tmImage.load(modelURL, metadataURL);
            // setModel(loadedModel);
            // setMaxPredictions(loadedModel.getTotalClasses());
            if (webcamRef.current) {
                await webcamRef.current.stop();
                webcamRef.current = null;
            }

            webcamRef.current = new tmImage.Webcam(400, 400, true);
            await webcamRef.current.setup();
            await webcamRef.current.play();
            if (webcamContainerRef.current) {
                webcamContainerRef.current.appendChild(webcamRef.current.canvas);
            }
            loop();
        };

        init();
    }, []);

    const loop = async () => {
        if (webcamRef.current) {
            webcamRef.current.update();
            if (processing) {
                await captureAndPredict();
            }
            window.requestAnimationFrame(loop);
        }
    };

    const captureAndPredict = async () => {
        const imageSrc = webcamRef.current.canvas.toDataURL('image/jpeg');
        const formData = new FormData();
        const response = await fetch(imageSrc);
        const blob = await response.blob();
        formData.append('image', blob, 'image.jpg');

        try {
            const res = await axios.post('http://127.0.0.1:3000/predict', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const { class_label, class_probability } = res.data;
            if (class_probability >= 0.40) {
                console.log("test",class_label, class_probability);
                setFruitName(class_label);
                setFruitProbability(class_probability);
                setFruitImageAlt(class_label);
                setFruitImageSrc(`./src/assets/image/${class_label}.jpg`);
                setFruitImageAlt(class_label);
                
            
            // Use local variables to ensure data consistency
            let fetchedWeight = 0;
            let fetchedPrice = 0;

            onValue(cartRef, (cartSnapshot) => {
                const cartData = cartSnapshot.val();
                if (cartData) {
                    fetchedWeight = cartData;
                    setWeight(cartData);
                } else {
                    console.log('Cart data not found');
                }

                // Update price only after weight is set
                onValue(priceRef, (priceSnapshot) => {
                    const priceData = priceSnapshot.val();
                    if (priceData) {
                        const fruitPrice = priceData[predictedFruitName];
                        if (fruitPrice) {
                            fetchedPrice = fruitPrice;
                            setPrice(fruitPrice);

                            // Ensure weight is set before calculating total price
                            setTotalPrice(fruitPrice * fetchedWeight);
                        } else {
                            console.log(`No price found for ${predictedFruitName}`);
                        }
                    } else {
                        console.log('Price data not found');
                    }
                });
            });
        }
        } catch (error) {
            console.error('Error predicting image', error);
        }
    };


    // Rest of the code...

    const handleOpenCamera = async () => {
        setOpenCamera(true);
        if (webcamRef.current) {
            await webcamRef.current.stop();
            webcamRef.current = null;
        }

        webcamRef.current = new tmImage.Webcam(400, 400, true);
        await webcamRef.current.setup();
        await webcamRef.current.play();
        if (webcamContainerRef.current) {
            webcamContainerRef.current.appendChild(webcamRef.current.canvas);
        }
        loop();
    };

    const handleCloseCamera = async () => {
        setOpenCamera(false);
        if (webcamRef.current) {
            await webcamRef.current.stop();
            webcamRef.current = null;
        }
    };

    // const predict = async () => {
    //     if (!model) {
    //         console.error('Model not loaded');
    //         return;
    //     }

    //     const prediction = await model.predict(webcamRef.current.canvas);
    //     let maxPrediction = 0;
    //     let predictedFruitName = '';
    //     for (let i = 0; i < prediction.length; i++) {
    //         if (prediction[i].probability > maxPrediction) {
    //             maxPrediction = prediction[i].probability;
    //             predictedFruitName = prediction[i].className;
    //         }
    //     }

    //     if (maxPrediction >= 0.40) {
    //         setFruitName(predictedFruitName);
    //         setFruitImageSrc(`./src/assets/image/${predictedFruitName}.jpg`);
    //         setFruitImageAlt(predictedFruitName);

    //         // Use local variables to ensure data consistency
    //         let fetchedWeight = 0;
    //         let fetchedPrice = 0;

    //         onValue(cartRef, (cartSnapshot) => {
    //             const cartData = cartSnapshot.val();
    //             if (cartData) {
    //                 fetchedWeight = cartData;
    //                 setWeight(cartData);
    //             } else {
    //                 console.log('Cart data not found');
    //             }

    //             // Update price only after weight is set
    //             onValue(priceRef, (priceSnapshot) => {
    //                 const priceData = priceSnapshot.val();
    //                 if (priceData) {
    //                     const fruitPrice = priceData[predictedFruitName];
    //                     if (fruitPrice) {
    //                         fetchedPrice = fruitPrice;
    //                         setPrice(fruitPrice);

    //                         // Ensure weight is set before calculating total price
    //                         setTotalPrice(fruitPrice * fetchedWeight);
    //                     } else {
    //                         console.log(`No price found for ${predictedFruitName}`);
    //                     }
    //                 } else {
    //                     console.log('Price data not found');
    //                 }
    //             });
    //         });
    //     } else {
    //         console.log("Prediction probability too low");
    //     }
    // };


    const startProcessing = async () => {
        setProcessing(true);

        for (let i = 0; i < 2; i++) {
            await captureAndPredict();
        }

        setProcessing(false);
    };

    const handleAddCart = () => {
        if (!fruitName) {
            toast.error('Vui lòng mở camera và chụp hình trước khi thêm vào giỏ hàng', {
                position: "top-center",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
            return;
        } else {
            const item = {
                name: fruitName,
                price: fruitprice,
                weight: weight,
                total: totalPrice,
            };
            const found = cart.find((element) => element.name === item.name);
            if (found) {
                const newCart = cart.map((element) => {
                    if (element.name === item.name) {
                        return {
                            ...element,
                            weight: element.weight + item.weight,
                            total: element.total + item.total,
                        };
                    }
                    return element;
                });
                setCart(newCart);
            } else {
                setCart([...cart, item]);
            }
            setCartCount(cartCount + 1);

            toast.success('Đã thêm vào giỏ hàng', {
                position: "top-center",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
            setFruitName('');
            setPrice(0);
            setWeight(0);
            setTotalPrice(0);
            setFruitImageSrc('');
            setFruitImageAlt('');
        }
    };

    const handleOpenModal = () => {
        setModal(true);
    };

    return (
        <div className='h-screen bg-slate-200 flex flex-row'>
            <FruitModal
                isOpen={modal}
                handleCloseModal={() => {
                    setModal(false);
                }}
                generatePDF={() => {

                    const doc = new jsPDF();
                    console.log(cartCount);

                    // Title
                    const titleText = "Invoice";
                    const titleWidth = doc.getStringUnitWidth(titleText) * doc.internal.getFontSize() / doc.internal.scaleFactor;
                    const centerX = (doc.internal.pageSize.width - titleWidth) / 2;
                    doc.setFontSize(18);
                    doc.text(titleText, centerX, 22);

                    // Line separator
                    doc.setLineWidth(0.2);
                    doc.line(14, 24, 196, 24);

                    // Invoice details
                    doc.setFontSize(12);
                    doc.text("Invoice Date:", 14, 30);

                    // Populate invoice details (dummy data used for demonstration)
                    const invoiceDetails = {
                        date: formatDate(currentDate),
                    };

                    doc.setFont("helvetica", "normal");
                    doc.text(invoiceDetails.date, 45, 30);

                    // Line separator
                    doc.setLineWidth(0.5);
                    doc.line(14, 35, 196, 35);

                    // Cart details
                    let yPosition = 44;
                    const xOffset = 14;
                    const yOffset = 6;

                    // Titles
                    doc.setFontSize(12);
                    doc.text("Product Name", xOffset, yPosition);
                    doc.text("Weight", xOffset + 50, yPosition);
                    doc.text("Price", xOffset + 80, yPosition);
                    doc.text("Total", xOffset + 110, yPosition);

                    yPosition += yOffset;

                    // Content
                    cart.forEach((item, index) => {
                        doc.text(item.name.toString(), xOffset, yPosition);
                        doc.text(item.weight.toString(), xOffset + 50, yPosition);
                        doc.text(item.price.toString(), xOffset + 80, yPosition);
                        doc.text(item.total.toString(), xOffset + 110, yPosition);
                        yPosition += yOffset; // Adjust spacing between rows
                    });

                    // Total
                    const total = cart.reduce((acc, item) => acc + item.total, 0);
                    doc.text("Total:", 80, yPosition + 10);
                    doc.text(total.toString(), 110, yPosition + 10);

                    // Save the PDF
                    doc.save("invoice.pdf");
                    toast.success("Invoice generated successfully!", {
                        position: "top-center",
                        autoClose: 3000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                    });
                    setModal(false);
                    setCartCount(0);
                    // Clear cart
                    setCart([]);
                }}
                cart={cart}
            />
            <div className='w-1/2 bg-white rounded m-2 flex flex-col justify-around'>
                {openCamera ? (
                    <>
                        <div id='webcam-container' className='h-5/6 rounded m-2 flex justify-around items-start' ref={webcamContainerRef}></div>
                        <div className='m-2 flex flex-row gap-3 justify-around items-center'>
                            <button
                                onClick={handleCloseCamera}
                                className='flex flex-row justify-center items-center gap-3 w-1/2 bg-violet-600 text-white p-2 rounded hover:bg-violet-900 hover:shadow-xl transition duration-500'
                            >
                                <FiCameraOff className='text-[20px]' />
                                {'Close Camera'}
                            </button>
                            <button
                                onClick={startProcessing}
                                className='flex flex-row justify-center items-center gap-3 w-1/2 bg-violet-600 text-white p-2 rounded hover:bg-violet-900 hover:shadow-xl transition duration-500'
                            >
                                <GiProcessor className='text-[20px]' />
                                {'Process Image'}
                            </button>
                            
                        </div>
                    </>
                ) : (
                    <>
                        <div id='webcam-container' className='h-5/6 flex justify-center items-center text-md text-slate-400' >
                            Bấm nút để mở camera
                        </div>
                        <div className='m-2 '>
                            <button
                                onClick={handleOpenCamera}
                                className='flex flex-row justify-center items-center gap-3 w-full bg-violet-600 text-white px-2 py-3 rounded hover:bg-violet-900 hover:shadow-xl transition duration-500'
                            >
                                <FaCamera className='text-[20px]' />
                                <div>
                                    {'Open Camera'}
                                </div>
                            </button>
                        </div>
                    </>
                )}

            </div>
            <div className='w-1/2 flex flex-col bg-white m-2 rounded-md'>
                <div className='h-12 flex justify-end m-4'>
                    {/* <div className='flex justify-end items-center text-black bg-red-100 w-28 h-10 rounded-full'>
                        <button
                            onClick={() => {
                                setModal(true);
                            }}
                            className='flex items-center justify-center w-full h-full bg-red-200'
                        >
                            <span>{cartCount}</span>
                            <CiShoppingCart className='text-[30px] mr-2 text-gray-500' />
                        </button>
                    </div> */}

                </div>
                <div className='w-full flex flex-row'>
                    <div className='w-44 h-44 m-2 rounded-full flex justify-center items-center'>
                        <div id="fruit-image" alt="" className='h-36 w-36 border-2 border-slate-200 rounded-full flex justify-center items-center'>
                            <img src={fruitImageSrc} alt={fruitImageAlt} className='h/2/3 w-2/3 flex justify-center items-center object-cover' />
                        </div>
                    </div>
                    <div className='w-2/3 flex flex-col'>
                        <div className='w-full flex justify-end'>
                            <div className="relative flex items-center">
                                <button
                                    onClick={handleOpenModal}
                                    className="flex items-center justify-center w-[50px] h-[50px] rounded-full bg-gray-200 relative "
                                >
                                    <div className="absolute top-0 left-8 z-10 w-[18px] h-[18px] flex justify-center items-center text-xs rounded-full bg-red-600 text-white">
                                        {cartCount}
                                    </div>
                                    <FaCartShopping className="text-[20px] text-gray-600 hover:scale-110 duration-300" />
                                </button>
                            </div>
                        </div>

                        <div className='rounded m-2 mb-1 flex flex-col'>
                            <div className='p-3 border-b-2 border-slate-400 m-2'>
                                <span className='text-left text-lg font-semibold'>Product Information</span>
                            </div>
                            <div className='flex flex-row text-center mb-5'>
                                <div className='w-1/3 text-slate-400 text-sm font-semibold uppercase'>Product Name</div>
                                <div className='w-1/3 text-slate-400 text-sm font-semibold uppercase'>Weight</div>
                                <div className='w-1/3 text-slate-400 text-sm font-semibold uppercase'>Price</div>
                                <div className='w-1/3 text-slate-400 text-sm font-semibold uppercase'>Total</div>
                            </div>
                            <div className='flex flex-row text-center'>
                                <label id="fruit-name" className='w-1/3'>{fruitName}</label>
                                <div id='fruit-weight' className='w-1/3'>{weight.toLocaleString()} gram</div>
                                <div id='fruit-price' className='w-1/3'>{fruitprice.toLocaleString()} VND</div>
                                <div id='total' className='w-1/3'>{totalPrice.toLocaleString()} VND</div>
                            </div>

                            <div className='flex justify-end mt-3 w-full'>
                                <div className='flex justify-end mt-3 w-full'>
                                    <button
                                        onClick={handleAddCart}
                                        className='flex flex-row gap-2 justify-center items-center bg-violet-600 text-white p-2 w-full rounded hover:bg-violet-900 hover:shadow-xl transition duration-500'
                                    >
                                        <CiShoppingCart className='text-[20px]' />
                                        <span>
                                            Add to Cart
                                        </span>
                                    </button>
                                    {/* {cartCount} */}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FruitPaymentSystem;
