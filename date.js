module.exports = () => {
    const today = new Date();
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    return today.toLocaleString('en-BD', options);
}