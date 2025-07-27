#!/usr/bin python
# -*- coding: utf-8 -*-

from collections import defaultdict
import streamlit as st
from pathlib import Path
from src.models.predict_model import make_prediction
from src.features.build_features import add_answer
import pandas as pd

home: str = "Project Home"
data: str = "Data Sources"
features: str = "Feature Engineering"
training: str = "Model Training"


def render_home() -> None:
    st.subheader("Project Home Page")
    st.write("Streamlit App Boilerplate that contains everything you need to get running.")

    st.subheader("Make a prediction")
    with st.form("model_prediction"):
        input_data = st.text_input(
            "Model Input", "Enter some input features to make a prediction"
        )
        is_submitted = st.form_submit_button()

    if not is_submitted:
        st.info("Press Submit to Make a Prediction")
        st.stop()
    st.subheader("Input:")
    st.write(input_data)
    prediction = make_prediction(input_data)
    st.subheader("Prediction:")
    st.write(prediction)


def render_data_directory(dir: Path) -> None:  # pragma: no cover
    st.subheader(dir.name)
    file_types = defaultdict(int)
    all_files = []
    for sub_path in (
        x for x in dir.iterdir() if x.is_file() and not x.name.startswith(".")
    ):
        file_types[sub_path.suffix] += 1
        all_files.append(sub_path.name)
    st.write("Total Files in Directory: ", len(all_files))
    if len(all_files):
        st.write("Total Files per File Type")
        st.json(file_types)
        with st.expander("All Files"):
            st.json(all_files)
    for sub_dir in (
        x for x in dir.iterdir() if x.is_dir() and not x.name.startswith(".")
    ):
        render_data_directory(sub_dir)


def render_data():
    st.subheader("Data Source Information")
    st.write("The following data were gathered from the following sources:")
    render_data_directory(Path("data"))


def render_features():
    st.subheader("Feature Engineering Process")
    st.write("The following transformations were applied to the following datasets:")
    st.subheader("Adding Answer to Universe Feature example:")
    df = pd.DataFrame(
        [
            {"name": "alice", "favorite_animal": "dog"},
            {"name": "bob", "favorite_animal": "cat"},
        ]
    )
    st.write("Initial data")
    st.write(df)
    df = add_answer(df)
    st.write("Transformed data")
    st.write(df)


def render_training():
    st.subheader("Model Training Overview")
    st.write("The following models and hyperparameters were tested:")
    for sub_path in (
        x
        for x in Path("models").iterdir()
        if x.is_file() and not x.name.startswith(".")
    ):
        st.subheader(sub_path.name)
        st.write("Size in bytes: ", len(sub_path.read_bytes()))

display_page: str = st.sidebar.radio("View Page:", (home, data, features, training))
st.header("Streamlit App")

match display_page:
    case str(home):
        render_home()
    case str(data):
        render_data()
    case str(features):
        render_features()
    case str(training):
        render_training()
    case _:
        print()
