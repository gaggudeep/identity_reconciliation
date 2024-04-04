import express from 'express';
import morgan from 'morgan';
const port = process.env.PORT || 8844;
const app = express();
app.use(morgan('tiny'));
app.listen(port, () => {
    console.log(`app running on port ${port}`);
});
//# sourceMappingURL=app.js.map