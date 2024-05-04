"use client";

import { TickSquare } from "iconsax-react";
import { Modal } from "react-bootstrap";
import { useEffect, useState } from "react";
import Loader from "@/app/_components/loader";
import { toast } from "react-toastify";
import {
  Timestamp,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { db } from "@/app/_components/firebase/fire_config";
import { v4 } from "uuid";
import { selectFormStyle, selectFormTheme } from "@/app/_utils/input_style";
import ReactSelect from "react-select";
import capitalize from "@/app/_utils/capitalize";
import { useAuth } from "@/app/_components/firebase/fire_auth_context";
import { intFloatOnly } from "@/app/_utils/keyboard_control";

const NewPayment = ({ newPayment, onHide }) => {
  const [show, setShow] = useState(!!newPayment);
  const [isLoading, setIsLoading] = useState(false);
  const [tpUsers, setTpUsers] = useState([]);
  const [insurances, setInsurances] = useState([]);
  const [tp, setTp] = useState(null);
  const [amount, setAmount] = useState("");
  const [commence, setCommence] = useState(null);
  const [expiry, setExpiry] = useState(null);
  const [insurance, setInsurance] = useState(null);
  const { authUser } = useAuth();

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, "insurances"), orderBy("createdOn", "desc")),
      (snap) => setInsurances(snap.docs.map((doc) => doc.data()))
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(
        collection(db, "users"),
        where("isTaxPayer", "==", true),
        orderBy("createdOn", "desc")
      ),
      (snap) => setTpUsers(snap.docs.map((doc) => doc.data()))
    );

    return () => unsubscribe();
  }, []);

  const onAddPayment = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const id = v4();
    const collRef = collection(db, "transactions");
    const commenceTimestamp = commence ? new Date(commence) : null;
    const expiryTimestamp = expiry ? new Date(expiry) : null;

    const userDoc = {
      transID: id,
      tp: tp.email,
      to: authUser.email,
      amount: amount,
      holder: tp.name.toUpperCase(),
      commence: commenceTimestamp
        ? Timestamp.fromDate(commenceTimestamp)
        : null,
      expiry: expiryTimestamp ? Timestamp.fromDate(expiryTimestamp) : null,
      insurance: {
        id: insurance.id,
        name: insurance.name,
        type: insurance.type,
      },
      createdOn: serverTimestamp(),
    };

    setDoc(doc(collRef, id), userDoc)
      .then(() => {
        handleClose();
        toast.dark("Payment completed successfully");
      })
      .catch((e) => {
        toast.dark(`Error occured: ${e.message}`, {
          className: "text-danger",
        });
      })
      .finally(() => setIsLoading(false));
  };

  const handleClose = () => {
    setShow(false);
    if (onHide) onHide();
  };

  return (
    <Modal scrollable size="lg" show={show} onHide={handleClose}>
      <Modal.Header className="py-2" closeButton>
        <Modal.Title className="h5">New Payment</Modal.Title>
      </Modal.Header>

      <Modal.Body className="p-0 m-0">
        <div className="container-fluid">
          <form className="row" onSubmit={onAddPayment}>
            <div className="col-md-6">
              <div className="mt-2 mb-3">
                <label className="form-label" htmlFor="tp">
                  Tax Payer
                </label>
                <ReactSelect
                  required
                  id="tp"
                  placeholder="eg: john joe"
                  options={tpUsers.map((tp) => ({
                    label: capitalize(tp.name),
                    value: tp,
                  }))}
                  styles={selectFormStyle}
                  theme={selectFormTheme}
                  onChange={(option) => setTp(option.value)}
                />
              </div>

              {tp && (
                <>
                  <div className="mb-3">
                    <label className="form-label" htmlFor="holder">
                      Holder
                    </label>
                    <input
                      type="text"
                      disabled
                      className="form-control cus-form-control rounded-2"
                      id="holder"
                      placeholder={tp.name.toUpperCase()}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label" htmlFor="amount">
                      Amount
                    </label>
                    <input
                      type="text"
                      required
                      className="form-control cus-form-control rounded-2"
                      id="amount"
                      placeholder="eg: 10000.00"
                      onChange={(e) => setAmount(e.target.value)}
                      onKeyDown={intFloatOnly}
                    />
                  </div>
                </>
              )}
            </div>

            {tp && (
              <div className="col-md-6">
                <div className="mb-3 mt-2">
                  <label className="form-label" htmlFor="commence">
                    Commence On
                  </label>
                  <input
                    type="date"
                    required
                    disabled={expiry !== null}
                    className="form-control cus-form-control rounded-2"
                    id="commence"
                    onChange={(e) => setCommence(e.target.value)}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label" htmlFor="expiry">
                    Expiry On
                  </label>
                  <input
                    type="date"
                    required
                    disabled={commence === null}
                    className="form-control cus-form-control rounded-2"
                    id="expiry"
                    min={commence}
                    placeholder="eg: 10000.00"
                    onChange={(e) => setExpiry(e.target.value)}
                  />
                </div>

                <div className="mt-2 mb-3">
                  <label className="form-label" htmlFor="insurance">
                    Insurance Type
                  </label>
                  <ReactSelect
                    required
                    id="insurance"
                    placeholder="eg: insurance type name"
                    options={insurances.map((tp) => ({
                      label: capitalize(tp.name),
                      value: tp,
                    }))}
                    styles={selectFormStyle}
                    theme={selectFormTheme}
                    onChange={(option) => setInsurance(option.value)}
                  />
                </div>
              </div>
            )}

            <div className="col-md-12 d-flex justify-content-end my-3">
              <button
                type="submit"
                disabled={isLoading}
                className="btn-dash btn-primary border-0"
              >
                <TickSquare size={20} />
                {isLoading ? <Loader /> : "Make Payment"}
              </button>
            </div>
          </form>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default NewPayment;